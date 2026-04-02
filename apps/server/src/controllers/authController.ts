import { Request, Response } from 'express';
import User from '../models/User';
import * as authService from '../services/authService';
import crypto from 'crypto';
import { sendNotification } from '../services/notificationService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    console.log(`📝 Registration attempt for: ${email}`);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️ Registration failed: User already exists (${email})`);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, firstName, lastName });
    
    const accessToken = authService.generateAccessToken(user._id.toString());
    const refreshToken = authService.generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    console.log(`✅ Registration successful: ${email}`);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ user, accessToken });
  } catch (error: unknown) {
    console.error(`❌ Registration Error for ${req.body.email}:`, error instanceof Error ? error.message : error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = authService.generateAccessToken(user._id.toString());
    const refreshToken = authService.generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user, accessToken });
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error: unknown) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token missing' });

    const decoded = authService.verifyRefreshToken(refreshToken) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = authService.generateAccessToken(user._id.toString());
    const newRefreshToken = authService.generateRefreshToken(user._id.toString());

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken: newAccessToken });
  } catch (_error: unknown) {
    res.status(403).json({ message: 'Session expired' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${email}`;
    const message = `You requested a password reset. Click the link to reset your password: <a href="${resetUrl}">Reset Password</a>`;

    await sendNotification({
      userId: user.id,
      email: user.email,
      type: 'PASSWORD_RESET',
      message
    });

    res.json({ message: 'Reset email sent' });
  } catch (error: unknown) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, email, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ 
      email, 
      resetPasswordToken: hashedToken, 
      resetPasswordExpires: { $gt: new Date() } 
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = newPassword; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Reset failed' });
  }
};
