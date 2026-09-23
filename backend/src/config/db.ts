import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Error connecting to MongoDB: ${(error as Error).message}`);
    console.warn(`[Database] Make sure MongoDB is running locally (e.g. mongodb://127.0.0.1:27017) or provide a valid MONGO_URI in .env`);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
