import { localDemo } from '../local-demo';
import jwt from 'jsonwebtoken';
import { isObjectIdOrHexString } from 'mongoose';
import { randomBytes } from 'node:crypto';

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

export function signAccessToken(userId: string,sessionId=randomBytes(32).toString('hex'),securityVersion=0, demoInstanceId?:string): string {
  return jwt.sign({sid:sessionId,sv:securityVersion,...(demoInstanceId?{authority:'local-demo',di:demoInstanceId}:{})}, getJwtSecret(), {
    algorithm: 'HS256',
    subject: userId,
    issuer,
    audience,
    expiresIn: TOKEN_LIFETIME_SECONDS,
  });
}

export function verifyAccessToken(token: string): string {
  return verifyTokenClaims(token).userId;
}
export function verifyTokenClaims(token:string):{userId:string;sessionId:string;securityVersion:number;demoInstanceId?:string}{
  const payload = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
    issuer,
    audience,
  });

  if (typeof payload === 'string' || !isObjectIdOrHexString(payload.sub)
    || typeof payload.exp !== 'number'||typeof payload.sid!=='string'||!/^[a-f0-9]{64}$/.test(payload.sid)||!Number.isSafeInteger(payload.sv)||Number(payload.sv)<0) {
    throw new Error('Invalid token claims');
  }
  if(payload.authority!==undefined&&(payload.authority!=='local-demo'||!localDemo.policy()||payload.di!==localDemo.policy().instance))throw new Error('Invalid authentication authority');
  return{...(payload.authority==='local-demo'?{demoInstanceId:payload.di as string}:{}),userId:payload.sub as string,sessionId:payload.sid,securityVersion:payload.sv as number};
}
