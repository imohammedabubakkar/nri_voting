import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TokenPayload {
  id: string;
  role: 'admin' | 'user';
  username?: string;
  aadhaar?: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
