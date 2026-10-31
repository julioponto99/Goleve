import mongoose from 'mongoose';

mongoose.connection.on('connected', () => {
  console.log('auth-service connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.warn('auth-service disconnected from MongoDB');
});

mongoose.connection.on('error', () => {
  // Driver messages may contain connection strings, credentials or document values.
  console.error('auth-service MongoDB connection error');
});

export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error('MONGO_URI must be set before starting auth-service');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      heartbeatFrequencyMS: 5000,
    });
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}

export async function isDatabaseHealthy(): Promise<boolean> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }

  try {
    await mongoose.connection.db.admin().ping({ timeoutMS: 2000 });
    return true;
  } catch {
    return false;
  }
}
