import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/voting_system',
  jwtSecret: process.env.JWT_SECRET || 'voting_system_fallback_secret_key_2026',
  jwtExpiresIn: '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  adminDefaultUsername: process.env.ADMIN_DEFAULT_USERNAME || 'abubakkar',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || '10092004',
};
