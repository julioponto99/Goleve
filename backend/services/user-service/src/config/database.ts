import mongoose, { Connection } from 'mongoose';

export async function openDatabase(uri: string): Promise<Connection> {
  if (!uri?.trim()) throw new Error('MONGO_URI is required');
  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, heartbeatFrequencyMS: 5000,
  });
  connection.on('error', () => console.error('user-service MongoDB connection error'));
  connection.on('disconnected', () => console.warn('user-service disconnected from MongoDB'));
  try {
    await connection.asPromise();
    return connection;
  } catch (error) {
    await connection.close();
    throw error;
  }
}

export async function isDatabaseHealthy(connection: Connection): Promise<boolean> {
  if (connection.readyState !== 1 || !connection.db) return false;
  try {
    await connection.db.admin().ping({ timeoutMS: 2000 });
    return true;
  } catch {
    return false;
  }
}
