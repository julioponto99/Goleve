import { readFileSync } from 'node:fs';

export interface UserSettings {
  authServiceUrl: string;
  dataMode: 'disabled' | 'synthetic';
  encryptionKey?: Buffer;
}

export function loadSettings(): UserSettings {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001';
  const parsed = new URL(authServiceUrl);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
    || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('AUTH_SERVICE_URL must be an HTTP(S) origin without credentials');
  }
  const dataMode = process.env.USER_DATA_MODE || 'disabled';
  if (dataMode !== 'disabled' && dataMode !== 'synthetic') {
    throw new Error('USER_DATA_MODE supports only disabled or synthetic; real data is not enabled');
  }
  let encryptionKey: Buffer | undefined;
  if (dataMode === 'synthetic') {
    const keyFile = process.env.USER_DATA_KEY_FILE;
    if (!keyFile) throw new Error('USER_DATA_KEY_FILE is required in synthetic mode');
    const encoded = readFileSync(keyFile, 'utf8').trim();
    if (!/^[a-f0-9]{64}$/i.test(encoded)) throw new Error('User data key must contain 32 random bytes in hexadecimal');
    encryptionKey = Buffer.from(encoded, 'hex');
  }
  return { authServiceUrl: parsed.origin, dataMode, encryptionKey };
}
