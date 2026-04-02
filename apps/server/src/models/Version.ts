import mongoose, { Schema, Document } from 'mongoose';

export interface IVersion extends Document {
  document: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  title: string;
  isSnapshot: boolean;
}

const VersionSchema: Schema = new Schema({
  document: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Auto-save version' },
  isSnapshot: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export default mongoose.model<IVersion>('Version', VersionSchema);
