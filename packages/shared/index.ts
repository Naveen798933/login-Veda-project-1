// Centralized constants and types for Enterprise Collaboration Platform
export enum UserRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarColor?: string;
  lastLogin?: string;
  isVerified?: boolean;
}

export interface DocumentCollaborator {
  user: string | User;
  role: UserRole;
  joinedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  owner: string | User;
  collaborators: DocumentCollaborator[];
  isPublic: boolean;
  lastModifiedBy?: string | User;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // For Soft Delete support
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  documentId: string;
  parentId?: string;
  isResolved: boolean;
  replies?: Comment[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'COMMENT' | 'SHARE' | 'SYSTEM';
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}
