import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Document from '../models/Document';
import User from '../models/User';
import { sendNotification } from '../services/notificationService';
import { canPerformAction } from '../middleware/rbacMiddleware';

/**
 * Extract mentions from comment content (e.g., @username)
 */
const extractMentions = (content: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = content.match(mentionRegex) || [];
  return matches.map(m => m.slice(1)); // Remove @ symbol
};

/**
 * Find users by their names for mentions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const findMentionedUsers = async (mentions: string[]): Promise<Array<any>> => {
  if (!mentions.length) return [];
  
  try {
    // Search for users matching the mentioned names (firstName or lastName)
    const users = await User.find({
      $or: [
        { firstName: { $in: mentions } },
        { lastName: { $in: mentions } },
        { email: { $in: mentions } }
      ]
    });
    return users;
  } catch (err) {
    console.error('Error finding mentioned users:', err);
    return [];
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { documentId, content, parentId } = req.body;
    
    // Validate document access
    const hasAccess = await canPerformAction(
      req.user!.id,
      documentId,
      'create_comment'
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'No permission to comment on this document' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const comment = new Comment({
      content,
      author: req.user!.id,
      document: documentId,
      parentId: parentId || null,
    });
    
    await comment.save();

    // Populate author details for response
    await comment.populate('author', 'firstName lastName email avatarColor');

    // Fetch current user for notifications
    const currentUser = await User.findById(req.user!.id);

    // Handle mentions - extract and notify mentioned users
    const mentions = extractMentions(content);
    if (mentions.length > 0) {
      const mentionedUsers = await findMentionedUsers(mentions);
      
      for (const mentionedUser of mentionedUsers) {
        // Don't notify the comment author
        if (mentionedUser._id.toString() === req.user!.id) continue;

        // Queue notification for mentioned user
        await sendNotification({
          userId: mentionedUser._id.toString(),
          email: mentionedUser.email,
          type: 'MENTION',
          title: `Mentioned in ${document.title}`,
          message: `${currentUser?.firstName} ${currentUser?.lastName} mentioned you in a comment: "${content.substring(0, 100)}..."`,
          metadata: {
            documentId,
            documentTitle: document.title,
            documentUrl: `${process.env.CLIENT_URL}/document/${documentId}`,
            commentId: comment._id.toString(),
          }
        });
      }
    }

    // Notify document collaborators about new comment (if not a reply)
    if (!parentId) {
      const collaboratorsToNotify = document.collaborators
        .filter(c => c.user.toString() !== req.user!.id); // Don't notify the author
      
      for (const collab of collaboratorsToNotify) {
        const collaborator = await User.findById(collab.user);
        if (collaborator) {
          await sendNotification({
            userId: collab.user.toString(),
            email: collaborator.email,
            type: 'COMMENT',
            title: `New comment on ${document.title}`,
            message: `${currentUser?.firstName} ${currentUser?.lastName} commented: "${content.substring(0, 100)}..."`,
            metadata: {
              documentId,
              documentTitle: document.title,
              documentUrl: `${process.env.CLIENT_URL}/document/${documentId}`,
              commentId: comment._id.toString(),
            }
          });
        }
      }
    }

    res.status(201).json(comment);
  } catch (error: unknown) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};


export const getCommentsByDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    // Check if user has access to this document
    const hasAccess = await canPerformAction(
      req.user!.id,
      documentId,
      'view_document'
    );
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'No permission to view comments on this document' });
    }

    const comments = await Comment.find({ document: documentId, parentId: null })
      .populate('author', 'firstName lastName email avatarColor')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'firstName lastName email avatarColor' }
      })
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error: unknown) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const resolveComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check RBAC - only editors and owners can resolve comments
    const hasPermission = await canPerformAction(
      req.user!.id,
      comment.document.toString(),
      'manage_comments'
    );

    if (!hasPermission) {
      return res.status(403).json({ message: 'No permission to resolve comments' });
    }
    
    comment.isResolved = !comment.isResolved;
    await comment.save();
    
    // Notify comment author about resolution
    const author = await User.findById(comment.author);
    if (author) {
      await sendNotification({
        userId: author._id.toString(),
        email: author.email,
        type: 'SYSTEM',
        title: 'Comment Resolution',
        message: `Your comment was ${comment.isResolved ? 'resolved' : 'reopened'}`,
        metadata: {
          commentId: comment._id.toString(),
          isResolved: comment.isResolved,
        }
      });
    }

    res.json(comment);
  } catch (error: unknown) {
    console.error('Error resolving comment:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Delete a comment (only by author or document owner)
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the comment author or document owner can delete
    const isAuthor = comment.author.toString() === req.user!.id;
    const hasOwnerPermission = await canPerformAction(
      req.user!.id,
      comment.document.toString(),
      'manage_comments'
    );

    if (!isAuthor && !hasOwnerPermission) {
      return res.status(403).json({ message: 'No permission to delete this comment' });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Also delete any replies to this comment
    await Comment.deleteMany({ parentId: commentId });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};
