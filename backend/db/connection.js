// MongoDB Connection using Mongoose
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/deepfake-detection';

/**
 * Connects to MongoDB database using Mongoose
 * @returns {Promise<void>}
 */
export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Closes the MongoDB connection
 */
export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

