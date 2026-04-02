import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@collaboration/shared';

export interface IInvitation extends Document {
  document: mongoose.Types.ObjectId;
  email: string;
  role: UserRole;
  inviter: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
}

const InvitationSchema = new Schema({
  document: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  email: { type: String, required: true },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
  inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'EXPIRED'], default: 'PENDING' }
}, {
  timestamps: true
});

export default mongoose.model<IInvitation>('Invitation', InvitationSchema);
