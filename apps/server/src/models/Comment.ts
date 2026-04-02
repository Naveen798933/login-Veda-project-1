import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  document: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  isResolved: boolean;
  replies: IComment[];
}

const CommentSchema: Schema = new Schema({
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  isResolved: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies (populated if parentId is this comment's id)
CommentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId',
  justOne: false,
});

export default mongoose.model<IComment>('Comment', CommentSchema);
