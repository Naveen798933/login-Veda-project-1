import { Response } from 'express';
import { UserRole } from '@collaboration/shared';
import Document from '../models/Document';
import mongoose from 'mongoose';

/**
 * RBAC Permission Matrix
 * Defines what actions each role can perform
 */
const PERMISSION_MATRIX: Record<UserRole, Set<string>> = {
  [UserRole.OWNER]: new Set([
    'view_document',
    'edit_document',
    'delete_document',
    'manage_collaborators',
    'change_visibility',
    'create_snapshot',
    'manage_comments',
    'create_comment',
    'resolve_comment',
    'restore_document'
  ]),
  [UserRole.EDITOR]: new Set([
    'view_document',
    'edit_document',
    'create_snapshot',
    'create_comment',
    'manage_comments', // Can resolve own comments
  ]),
  [UserRole.COMMENTER]: new Set([
    'view_document',
    'create_comment',
  ]),
  [UserRole.VIEWER]: new Set([
    'view_document',
  ]),
};

/**
 * Check if a user has a specific permission for an action
 */
export const hasPermission = (role: UserRole | undefined, action: string): boolean => {
  if (!role) return false;
  return PERMISSION_MATRIX[role]?.has(action) ?? false;
};

/**
 * Get effective role of a user on a document
 * Returns 'owner', 'editor', 'commenter', 'viewer', or null if no access
 */
export const getUserRoleOnDocument = async (
  userId: string | mongoose.Types.ObjectId,
  documentId: string | mongoose.Types.ObjectId
): Promise<UserRole | null> => {
  const doc = await Document.findById(documentId).select(
    'owner collaborators'
  );

  if (!doc) return null;

  const userIdStr = userId.toString();
  const ownerId = doc.owner.toString();

  if (userIdStr === ownerId) {
    return UserRole.OWNER;
  }

  const collaborator = doc.collaborators.find(
    c => c.user.toString() === userIdStr
  );

  return collaborator?.role ?? null;
};

/**
 * Helper function to check if two user IDs are the same
 */
export const isSameUser = (
  userId1: string | mongoose.Types.ObjectId,
  userId2: string | mongoose.Types.ObjectId
): boolean => {
  return userId1.toString() === userId2.toString();
};

/**
 * Middleware/Helper to check document access
 * Returns the document and the user's role
 */
export const checkDocumentAccess = async (
  userId: string | mongoose.Types.ObjectId,
  documentId: string | mongoose.Types.ObjectId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ document: any; role: UserRole | null; hasAccess: boolean }> => {
  const doc = await Document.findById(documentId);
  const role = await getUserRoleOnDocument(userId, documentId);

  return {
    document: doc,
    role,
    hasAccess: !!(role || doc?.isPublic)
  };
};

/**
 * Check if user can perform an action on a document
 */
export const canPerformAction = async (
  userId: string | mongoose.Types.ObjectId,
  documentId: string | mongoose.Types.ObjectId,
  action: string
): Promise<boolean> => {
  const { role, hasAccess } = await checkDocumentAccess(userId, documentId);
  
  if (!hasAccess) return false;
  return hasPermission(role || UserRole.VIEWER, action);
};

/**
 * Express middleware factory for checking document access
 */
export const requireDocumentAccess = (requiredAction: string = 'view_document') => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: Response, next: any) => {
    try {
      const { id: documentId } = req.params;
      const userId = req.user?.id;

      if (!userId || !documentId) {
        return res.status(400).json({ message: 'Missing userId or documentId' });
      }

      const { document, role, hasAccess } = await checkDocumentAccess(
        userId,
        documentId
      );

      if (!hasAccess || !document) {
        return res.status(403).json({ message: 'Access denied to this document' });
      }

      if (!hasPermission(role || UserRole.VIEWER, requiredAction)) {
        return res.status(403).json({
          message: `Your role (${role}) does not have permission to ${requiredAction}`
        });
      }

      // Attach document and role info to request for use in controllers
      req.document = document;
      req.userRole = role;
      next();
    } catch (error: unknown) {
      console.error('RBAC check failed:', error);
      res.status(500).json({ message: 'Authorization check failed' });
    }
  };
};
