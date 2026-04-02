import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'supersecretaccess';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'supersecretrefresh';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET);
};
