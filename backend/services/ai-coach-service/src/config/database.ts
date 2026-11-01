import mongoose, { Connection } from 'mongoose';
export function validateDatabaseUri(uri: string) {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname) || !/^\/goleve_ai_(test|local)_[a-f0-9]{16}(?:_[a-z_]{1,20})?$/.test(parsed.pathname)) throw new Error('AI Coach requires its own isolated local database');
}
export async function openDatabase(uri: string): Promise<Connection> {
  validateDatabaseUri(uri);
  const connection = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
  connection.on('error', () => console.error('ai-coach-service database unavailable'));
  try { await connection.asPromise(); return connection; } catch (error) { await connection.close(); throw error; }
}
export async function isDatabaseHealthy(connection: Connection): Promise<boolean> {
  if (connection.readyState !== 1 || !connection.db) return false;
  try { await connection.db.admin().ping({ timeoutMS: 2000 }); return true; } catch { return false; }
}
