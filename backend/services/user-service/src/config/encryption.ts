import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';

export interface EncryptionEnvelope {
  ciphertext: string;
  iv: string;
  authenticationTag: string;
  keyId: string;
  algorithmVersion: string;
}

export interface EncryptionContext {
  collection: string;
  authUserId: string;
  id: string;
  version: number;
}

export function createEncryption(key: Buffer) {
  if (key.length !== 32) throw new Error('Invalid user data encryption key');
  const encryptionKey = Buffer.from(hkdfSync('sha256', key, '', 'goleve.user.encryption.v1', 32));
  const fingerprintKey = Buffer.from(hkdfSync('sha256', key, '', 'goleve.user.idempotency.v1', 32));
  const aad = (context: EncryptionContext) => Buffer.from(JSON.stringify([
    'goleve-user-v1', context.collection, context.authUserId, context.id, context.version,
  ]));
  return {
    encrypt(value: unknown, context: EncryptionContext): EncryptionEnvelope {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
      cipher.setAAD(aad(context));
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return { ciphertext: ciphertext.toString('base64'), iv: iv.toString('base64'),
        authenticationTag: cipher.getAuthTag().toString('base64'), keyId: 'user-local-v1', algorithmVersion: 'aes-256-gcm-v1' };
    },
    decrypt<T>(value: EncryptionEnvelope, context: EncryptionContext): T {
      if (value.keyId !== 'user-local-v1' || value.algorithmVersion !== 'aes-256-gcm-v1') {
        throw new Error('Unsupported encrypted payload');
      }
      const iv = Buffer.from(value.iv, 'base64');
      const tag = Buffer.from(value.authenticationTag, 'base64');
      if (iv.length !== 12 || tag.length !== 16) throw new Error('Invalid encrypted payload');
      const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
      decipher.setAAD(aad(context));
      decipher.setAuthTag(tag);
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, 'base64')), decipher.final()]).toString('utf8')) as T;
    },
    fingerprint(value: unknown): string {
      return createHmac('sha256', fingerprintKey).update(JSON.stringify(value)).digest('hex');
    },
  };
}

export type UserEncryption = ReturnType<typeof createEncryption>;
