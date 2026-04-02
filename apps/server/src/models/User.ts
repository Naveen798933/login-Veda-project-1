import mongoose, { Schema } from 'mongoose';
import argon2 from 'argon2';

export interface IUser {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  lastLogin: Date;
  isVerified: boolean;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}

export type IUserDocument = IUser & mongoose.Document;

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatarColor: { type: String, default: () => `#${Math.floor(Math.random()*16777215).toString(16)}` },
  lastLogin: { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = (ret._id as mongoose.Types.ObjectId).toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.refreshToken;
      return ret;
    }
  }
});

// Hash password before saving
UserSchema.pre<IUserDocument>('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await argon2.hash(this.password!);
    next();
  } catch (err: unknown) {
    next(err instanceof Error ? err : new Error(String(err)));
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(this: IUserDocument, password: string): Promise<boolean> {
  return await argon2.verify(this.password!, password);
};

export default mongoose.model<IUserDocument>('User', UserSchema);
