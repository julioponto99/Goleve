import jwt from 'jsonwebtoken';
import { isObjectIdOrHexString } from 'mongoose';

export const TOKEN_LIFETIME_SECONDS = 3600;
const issuer = 'goleve-auth';
const audience = 'goleve-api';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret?.trim()) {
    throw new Error('JWT_SECRET must be set before starting auth-service');
  }
  if (process.env.NODE_ENV === 'production') {
    const placeholder = /development|change[-_ ]?me|replace[-_ ]?me|(?:dev|test|example)[-_ ]?secret/i;
    if (Buffer.byteLength(secret, 'utf8') < 32 || secret !== secret.trim()
      || placeholder.test(secret) || new Set(secret).size < 12 || /^(.{1,16})\1+$/.test(secret)) {
      throw new Error('Production JWT_SECRET must be a strong random secret of at least 32 bytes');
    }
  }
  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    algorithm: 'HS256',
    subject: userId,
    issuer,
    audience,
    expiresIn: TOKEN_LIFETIME_SECONDS,
  });
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer,
    audience,
  });

  if (typeof payload === 'string' || !isObjectIdOrHexString(payload.sub)
    || typeof payload.exp !== 'number') {
    throw new Error('Invalid token claims');
  }
  return payload.sub as string;
}
