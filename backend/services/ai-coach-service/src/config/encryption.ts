import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from 'node:crypto';
export interface Envelope { ciphertext: string; iv: string; tag: string; keyId: string; version: number }
export function createEncryption(secret: Buffer) {
  if (secret.length !== 32) throw new Error('AI data encryption requires a separate 32-byte key');
  const key = Buffer.from(hkdfSync('sha256', secret, '', 'goleve.ai-coach.encryption.v1', 32));
  const fingerprintKey = Buffer.from(hkdfSync('sha256', secret, '', 'goleve.ai-coach.fingerprint.v1', 32));
  return {
    encrypt(value: unknown, binding: string): Envelope {
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(binding));
      return { ciphertext: Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), keyId: 'ai-local-v1', version: 1 };
    },
    decrypt<T>(value: Envelope, binding: string): T {
      if (value.keyId !== 'ai-local-v1' || value.version !== 1) throw new Error('Unsupported AI encryption envelope');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(value.iv, 'base64')); decipher.setAAD(Buffer.from(binding)); decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, 'base64')), decipher.final()]).toString('utf8')) as T;
    },
    fingerprint(value: unknown) { return createHmac('sha256', fingerprintKey).update(JSON.stringify(value)).digest('hex'); },
  };
}
export type CoachEncryption = ReturnType<typeof createEncryption>;
