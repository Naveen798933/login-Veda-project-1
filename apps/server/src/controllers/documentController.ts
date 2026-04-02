import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Document from '../models/Document';
import Version from '../models/Version';
import Invitation from '../models/Invitation';
import User from '../models/User';
import crypto from 'crypto';
import * as notificationService from '../services/notificationService';
import { canPerformAction } from '../middleware/rbacMiddleware';

/**
 * Create a new document
 */
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const document = new Document({
      title,
      owner: req.user!.id,
      lastModifiedBy: req.user!.id
    });
    await document.save();
    
    // Populate owner details for response
    await document.populate('owner', 'firstName lastName email avatarColor');
    
    res.status(201).json(document);
  } catch (error: unknown) {
    console.error('Error creating document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Get all documents for the current user
 */
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await Document.find({
      deletedAt: null,
      $or: [
        { owner: req.user!.id },
        { 'collaborators.user': req.user!.id },
        { isPublic: true }
      ]
    })
      .populate('owner', 'firstName lastName email avatarColor')
      .populate('lastModifiedBy', 'firstName lastName email avatarColor')
      .sort({ updatedAt: -1 });
    res.json(documents);
  } catch (error: unknown) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Get trashed documents for the current user
 */
export const getTrash = async (req: Request, res: Response) => {
  try {
    const documents = await Document.find({
      deletedAt: { $ne: null },
      owner: req.user!.id // Only show own trashed documents
    })
      .populate('owner', 'firstName lastName email avatarColor')
      .sort({ deletedAt: -1 });
    res.json(documents);
  } catch (error: unknown) {
    console.error('Error fetching trash:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document || document.deletedAt) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    const canAccess = await canPerformAction(req.user!.id, document._id, 'view_document');
    
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied to this document' });
    }

    // Populate references
    await document.populate([
      { path: 'owner', select: 'firstName lastName email avatarColor' },
      { path: 'lastModifiedBy', select: 'firstName lastName email avatarColor' },
      { path: 'collaborators.user', select: 'firstName lastName email avatarColor' }
    ]);

    res.json(document);
  } catch (error: unknown) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Update a document (title, content, visibility)
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { title, content, isPublic } = req.body;
    const document = await Document.findById(req.params.id);
    
    if (!document || document.deletedAt) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check RBAC - need edit permission
    const canEdit = await canPerformAction(req.user!.id, document._id, 'edit_document');
    if (!canEdit) {
      return res.status(403).json({ message: 'No permission to edit this document' });
    }

    // Update fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (isPublic !== undefined && document.owner.toString() === req.user!.id) {
      // Only owner can change visibility
      document.isPublic = isPublic;
    }
    
    document.lastModifiedBy = req.user!.id as unknown as mongoose.Types.ObjectId;
    await document.save();

    // Create auto-save version if content changed
    if (content !== undefined) {
      const lastVersion = await Version.findOne({ document: document._id }).sort({ createdAt: -1 });
      if (!lastVersion || lastVersion.content !== content) {
        const version = new Version({
          document: document._id,
          content,
          author: req.user!.id,
          title: 'Auto-save',
          isSnapshot: false
        });
        await version.save();
      }
    }

    await document.populate('lastModifiedBy', 'firstName lastName email avatarColor');
    res.json(document);
  } catch (error: unknown) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Create a manual snapshot of current document state
 */
export const createSnapshot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title: snapshotTitle } = req.body;
    
    const document = await Document.findById(id);
    if (!document || document.deletedAt) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission
    const canSnapshot = await canPerformAction(req.user!.id, document._id, 'create_snapshot');
    if (!canSnapshot) {
      return res.status(403).json({ message: 'No permission to create snapshot' });
    }

    const snapshot = new Version({
      document: id,
      content: document.content,
      author: req.user!.id,
      title: snapshotTitle || `Snapshot - ${new Date().toLocaleString()}`,
      isSnapshot: true
    });

    await snapshot.save();
    await snapshot.populate('author', 'firstName lastName email avatarColor');
    
    res.status(201).json(snapshot);
  } catch (error: unknown) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Get all versions of a document
 */
export const getVersions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission to view versions
    const canView = await canPerformAction(req.user!.id, document._id, 'view_document');
    if (!canView) {
      return res.status(403).json({ message: 'No permission to view versions' });
    }

    const versions = await Version.find({ document: id })
      .populate('author', 'firstName lastName email avatarColor')
      .sort({ createdAt: -1 });
    
    res.json(versions);
  } catch (error: unknown) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Restore document from a previous version
 */
export const restoreVersion = async (req: Request, res: Response) => {
  try {
    const { id, versionId } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission to edit
    const canEdit = await canPerformAction(req.user!.id, document._id, 'edit_document');
    if (!canEdit) {
      return res.status(403).json({ message: 'No permission to restore this document' });
    }

    const version = await Version.findById(versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Create a snapshot of current state before restoring
    const backupSnapshot = new Version({
      document: id,
      content: document.content,
      author: req.user!.id,
      title: `Backup before restore - ${new Date().toLocaleString()}`,
      isSnapshot: true
    });
    await backupSnapshot.save();

    // Restore the version
    document.content = version.content;
    document.lastModifiedBy = req.user!.id as unknown as mongoose.Types.ObjectId;
    await document.save();

    res.json({
      message: 'Document restored successfully',
      document,
      backupId: backupSnapshot._id
    });
  } catch (error: unknown) {
    console.error('Error restoring version:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Soft delete a document (move to trash)
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can delete their own documents
    if (document.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Only the owner can delete this document' });
    }

    document.deletedAt = new Date();
    await document.save();
    
    // Notify collaborators
    for (const collab of document.collaborators) {
      const user = await User.findById(collab.user);
      if (user) {
        await notificationService.sendNotification({
          userId: collab.user.toString(),
          email: user.email,
          type: 'SYSTEM',
          title: 'Document Deleted',
          message: `Document "${document.title}" has been deleted by the owner.`,
          metadata: { documentId: document._id.toString() }
        });
      }
    }

    res.json({ message: 'Document moved to trash successfully' });
  } catch (error: unknown) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Permanently restore a document from trash
 */
export const restoreDocument = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document || !document.deletedAt) {
      return res.status(404).json({ message: 'Document not found in trash' });
    }

    // Only owner can restore
    if (document.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Only the owner can restore this document' });
    }

    document.deletedAt = undefined;
    await document.save();
    
    res.json({message: 'Document restored successfully from trash' });
  } catch (error: unknown) {
    console.error('Error restoring document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Permanently delete a document from trash
 */
export const permanentlyDeleteDocument = async (req: Request, res: Response) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only owner can permanently delete
    if (document.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Only the owner can permanently delete this document' });
    }

    // Delete all versions and comments too
    await Version.deleteMany({ document: document._id });
    await Document.deleteOne({ _id: document._id });
    
    res.json({ message: 'Document permanently deleted' });
  } catch (error: unknown) {
    console.error('Error permanently deleting document:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Search documents with full-text search
 */
export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const { q, limit = '20' } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json([]);
    }

    const documents = await Document.find({
      $text: { $search: q },
      deletedAt: null,
      $or: [
        { owner: req.user!.id },
        { 'collaborators.user': req.user!.id },
        { isPublic: true }
      ]
    })
      .populate('owner', 'firstName lastName email avatarColor')
      .limit(parseInt(limit as string))
      .sort({ score: { $meta: 'textScore' } });

    res.json(documents);
  } catch (error: unknown) {
    console.error('Error searching documents:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Invite a user to collaborate on a document
 */
export const inviteToDoc = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Only owner can invite
    if (document.owner.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Only the owner can invite collaborators' });
    }

    // Find user by email to check if already a collaborator
    const invitedUser = await User.findOne({ email });
    if (invitedUser) {
      const isAlreadyCollaborator = document.collaborators.some(c => 
        c.user.toString() === invitedUser._id.toString()
      );
      if (isAlreadyCollaborator) {
        return res.status(400).json({ message: 'User is already a collaborator on this document' });
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invitation = new Invitation({
      document: id,
      email,
      role,
      inviter: req.user!.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await invitation.save();

    // Queue notification
    const inviteUrl = `${process.env.CLIENT_URL}/document/${id}?invite=${token}`;
    await notificationService.sendNotification({
      userId: 'invite-' + token,
      email,
      type: 'SHARE',
      title: `Invited to "${document.title}"`,
      message: `You've been invited to collaborate on "${document.title}" as a ${role}.`,
      metadata: {
        documentId: document._id.toString(),
        documentTitle: document.title,
        role,
        inviteUrl
      }
    });

    res.status(201).json({ message: 'Invitation sent', invitationId: invitation._id });
  } catch (error: unknown) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Accept an invitation to collaborate
 */
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token, status: 'PENDING' });
    
    if (!invitation || invitation.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired invitation' });
    }

    const document = await Document.findById(invitation.document);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if already a collaborator
    const alreadyCollaborator = document.collaborators.some(c => 
      c.user.toString() === req.user!.id
    );

    if (!alreadyCollaborator) {
      // Add as collaborator
      document.collaborators.push({
        user: req.user!.id as unknown as mongoose.Types.ObjectId,
        role: invitation.role
      });
    }

    invitation.status = 'ACCEPTED';
    await Promise.all([document.save(), invitation.save()]);

    // Notify the inviter
    const inviter = await User.findById(invitation.inviter);
    if (inviter) {
      await notificationService.sendNotification({
        userId: invitation.inviter.toString(),
        email: inviter.email,
        type: 'SYSTEM',
        title: 'Invitation Accepted',
        message: `User ${req.user!.email} accepted your invitation to collaborate on "${document.title}".`,
        metadata: { documentId: document._id.toString() }
      });
    }

    res.json({ message: 'Invitation accepted', documentId: document._id });
  } catch (error: unknown) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

/**
 * Get list of collaborators for a document
 */
export const getCollaborators = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id)
      .populate({
        path: 'collaborators.user',
        select: 'firstName lastName email avatarColor'
      })
      .populate('owner', 'firstName lastName email avatarColor');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission
    const canView = await canPerformAction(req.user!.id, document._id, 'view_document');
    if (!canView) {
      return res.status(403).json({ message: 'No permission to view collaborators' });
    }

    res.json({
      owner: document.owner,
      collaborators: document.collaborators
    });
  } catch (error: unknown) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};
