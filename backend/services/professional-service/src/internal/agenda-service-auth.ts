import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const SERVICE_AUDIENCE = 'professional-service:appointments:v1';
export const SERVICE_PATH = '/internal/v1/agenda/eligibility';
export interface ServiceKeys { activeId: string; keys: Record<string, Buffer> }
export function loadServiceKeys(): ServiceKeys {
  const activeId = process.env.AGENDA_SERVICE_KEY_ID || '';
  const file = process.env.AGENDA_SERVICE_KEY_FILE;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(activeId) || !file) throw new Error('Dedicated Agenda service credential required');
  const read = (name: string) => { const value = readFileSync(name, 'utf8').trim(); if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('Invalid service credential'); return Buffer.from(value, 'hex'); };
  const keys: Record<string, Buffer> = { [activeId]: read(file) };
  const previous = process.env.AGENDA_SERVICE_PREVIOUS_KEY_ID, previousFile = process.env.AGENDA_SERVICE_PREVIOUS_KEY_FILE;
  if (previous || previousFile) {
    if (!previous || !previousFile || !/^[A-Za-z0-9_-]{1,40}$/.test(previous) || previous === activeId) throw new Error('Invalid service key rotation configuration');
    keys[previous] = read(previousFile);
  }
  return { activeId, keys };
}
const digest = (body: unknown) => createHash('sha256').update(JSON.stringify(body)).digest('hex');
export function signServiceRequest(body: unknown, ring: ServiceKeys, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const payload = Buffer.from(JSON.stringify({ v: 1, kid: ring.activeId, iss: 'agenda-service', aud: SERVICE_AUDIENCE,
    scope: 'appointment-eligibility:read', iat, exp: iat + 15, jti: randomUUID(), method: 'POST', path: SERVICE_PATH, bodyHash: digest(body) })).toString('base64url');
  const signature = createHmac('sha256', ring.keys[ring.activeId]).update(payload).digest('base64url');
  return 'AgendaService ' + payload + '.' + signature;
}
export function verifyServiceRequest(authorization: string | undefined, body: unknown, ring: ServiceKeys, now = Date.now()) {
  try {
    if (!authorization || authorization.length > 2048 || !/^AgendaService [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) throw new Error();
    const [encoded, signature] = authorization.slice(14).split('.');
    const p = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Record<string, unknown>;
    const fields = ['v', 'kid', 'iss', 'aud', 'scope', 'iat', 'exp', 'jti', 'method', 'path', 'bodyHash'];
    if (!p || Object.keys(p).length !== fields.length || Object.keys(p).some(k => !fields.includes(k)) || typeof p.kid !== 'string'
      || !Object.prototype.hasOwnProperty.call(ring.keys, p.kid)) throw new Error();
    const expected = createHmac('sha256', ring.keys[p.kid]).update(encoded).digest(), supplied = Buffer.from(signature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error();
    const time = Math.floor(now / 1000);
    if (p.v !== 1 || p.iss !== 'agenda-service' || p.aud !== SERVICE_AUDIENCE || p.scope !== 'appointment-eligibility:read'
      || p.method !== 'POST' || p.path !== SERVICE_PATH || p.bodyHash !== digest(body) || !Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp)
      || Number(p.iat) > time + 2 || Number(p.iat) < time - 15 || Number(p.exp) <= time || Number(p.exp) - Number(p.iat) !== 15
      || typeof p.jti !== 'string' || !/^[a-f0-9-]{36}$/.test(p.jti)) throw new Error();
    return { nonce: p.jti, expiresAt: new Date(Number(p.exp) * 1000) };
  } catch { throw new Error('Invalid Agenda service authentication'); }
}
