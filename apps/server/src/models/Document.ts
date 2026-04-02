import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@collaboration/shared';

export interface IDocument extends Document {
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;
  collaborators: {
    user: mongoose.Types.ObjectId;
    role: UserRole;
  }[];
  isPublic: boolean;
  lastModifiedBy: mongoose.Types.ObjectId;
  deletedAt?: Date;
}

const DocumentSchema: Schema = new Schema({
  title: { type: String, required: true, default: 'Untitled Document' },
  content: { type: String, default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.EDITOR }
  }],
  isPublic: { type: Boolean, default: false },
  lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Full-text search index
DocumentSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<IDocument>('Document', DocumentSchema);
