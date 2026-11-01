import { readFileSync } from 'node:fs';
import { validateDatabaseUri } from './database';
import { CoachProvider, HttpJsonProvider, UnavailableProvider } from '../providers/provider';
export type Domain = 'user' | 'training' | 'hydration' | 'performance' | 'agenda';
export interface CoachSettings { enabled: boolean; authOrigin: string; origins: Partial<Record<Domain, string>>; key?: Buffer; provider: CoachProvider }
export function origin(value: string): string {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Service configuration requires an HTTP(S) origin without credentials');
  return u.origin;
}
export function loadSettings(): CoachSettings {
  const flag = process.env.AI_COACH_ENABLED || 'false';
  if (!['false', 'true'].includes(flag)) throw new Error('Invalid AI_COACH_ENABLED');
  if (flag === 'false') return { enabled: false, authOrigin: origin(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001'), origins: {}, provider: new UnavailableProvider() };
  if (!['test', 'development'].includes(process.env.NODE_ENV || '') || process.env.AI_COACH_MODE !== 'isolated') throw new Error('AI Coach is restricted to explicitly isolated synthetic local use');
  validateDatabaseUri(process.env.MONGO_URI || '');
  if (!process.env.AUTH_SERVICE_URL || !process.env.AI_COACH_DATA_KEY_FILE) throw new Error('Explicit Auth origin and independent AI data key file required');
  const encoded = readFileSync(process.env.AI_COACH_DATA_KEY_FILE, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/i.test(encoded)) throw new Error('AI data key must contain 32 random bytes in hexadecimal');
  const origins: Partial<Record<Domain, string>> = {};
  for (const [domain, variable] of Object.entries({ user: 'USER_SERVICE_URL', training: 'TRAINING_SERVICE_URL', hydration: 'HYDRATION_SERVICE_URL', performance: 'PERFORMANCE_SERVICE_URL', agenda: 'AGENDA_SERVICE_URL' })) {
    if (process.env[variable]) origins[domain as Domain] = origin(process.env[variable]!);
  }
  let provider: CoachProvider = new UnavailableProvider();
  const kind = process.env.AI_COACH_PROVIDER || 'none';
  if (!['none', 'http-json-v1'].includes(kind)) throw new Error('Unsupported AI provider');
  if (kind === 'http-json-v1') {
    const url = new URL(process.env.AI_COACH_PROVIDER_URL || '');
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('AI model endpoint requires HTTPS without URL credentials');
    const model = process.env.AI_COACH_MODEL || '';
    if (!/^[A-Za-z0-9._:/-]{1,100}$/.test(model)) throw new Error('Explicit model identifier required');
    const credential = process.env.AI_COACH_PROVIDER_KEY_FILE ? readFileSync(process.env.AI_COACH_PROVIDER_KEY_FILE, 'utf8').trim() : undefined;
    if (credential !== undefined && (!credential || credential.length > 4096 || /\s/.test(credential))) throw new Error('Invalid provider credential file');
    provider = new HttpJsonProvider(url.href, model, credential);
  }
  return { enabled: true, authOrigin: origin(process.env.AUTH_SERVICE_URL), origins, key: Buffer.from(encoded, 'hex'), provider };
}
