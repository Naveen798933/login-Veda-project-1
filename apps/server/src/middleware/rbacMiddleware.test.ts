import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasPermission, isSameUser, canPerformAction } from '../middleware/rbacMiddleware';
import { UserRole } from '@collaboration/shared';
import mongoose from 'mongoose';

describe('RBAC Middleware', () => {
  describe('hasPermission', () => {
    it('should grant owner all permissions', () => {
      expect(hasPermission(UserRole.OWNER, 'view_document')).toBe(true);
      expect(hasPermission(UserRole.OWNER, 'edit_document')).toBe(true);
      expect(hasPermission(UserRole.OWNER, 'delete_document')).toBe(true);
    });

    it('should grant editor edit permissions', () => {
      expect(hasPermission(UserRole.EDITOR, 'edit_document')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'view_document')).toBe(true);
      expect(hasPermission(UserRole.EDITOR, 'delete_document')).toBe(false);
    });

    it('should grant viewer only view permissions', () => {
      expect(hasPermission(UserRole.VIEWER, 'view_document')).toBe(true);
      expect(hasPermission(UserRole.VIEWER, 'edit_document')).toBe(false);
      expect(hasPermission(UserRole.VIEWER, 'delete_document')).toBe(false);
    });

    it('should grant commenter comment permissions', () => {
      expect(hasPermission(UserRole.COMMENTER, 'create_comment')).toBe(true);
      expect(hasPermission(UserRole.COMMENTER, 'edit_document')).toBe(false);
    });
  });

  describe('isSameUser', () => {
    it('should return true for identical user IDs', () => {
      const userId = new mongoose.Types.ObjectId();
      expect(isSameUser(userId, userId)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const userId1 = new mongoose.Types.ObjectId();
      const userId2 = new mongoose.Types.ObjectId();
      expect(isSameUser(userId1, userId2)).toBe(false);
    });

    it('should work with string IDs converted to ObjectId', () => {
      const id = new mongoose.Types.ObjectId();
      expect(isSameUser(id.toString(), id)).toBe(true);
    });
  });
});
