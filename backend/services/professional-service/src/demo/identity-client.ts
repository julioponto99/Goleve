import { readFileSync } from 'node:fs';
export interface DemoIdentityConfig { instanceId: string; serviceKey: Buffer }
export interface DemoIdentityReader { read(id: string): Promise<{ id: string; userType: 'utilizador' | 'profissional' } | null> }
export function loadDemoIdentityConfig(authOrigin: string, dataMode: string, reviewMode: string, reviewerIds: readonly string[]): DemoIdentityConfig | undefined {
  const mode = process.env.GOLEVE_DEMO_MODE || 'disabled';
  if (mode === 'disabled') return undefined;
  if (mode !== 'isolated' || !['development', 'test'].includes(process.env.NODE_ENV || '') || dataMode !== 'synthetic'
    || reviewMode !== 'disabled' || reviewerIds.length) throw new Error('Isolated demo cannot enable administrative approval');
  const instanceId = process.env.DEMO_INSTANCE_ID || '';
  if (!/^[a-f0-9]{16}$/.test(instanceId)) throw new Error('Invalid isolated demo instance');
  const uri = new URL(process.env.MONGO_URI || ''), auth = new URL(authOrigin);
  if (uri.protocol !== 'mongodb:' || !['mongodb', 'localhost', '127.0.0.1'].includes(uri.hostname)
    || uri.pathname !== '/goleve_demo_' + instanceId + '_professional' || uri.username || uri.password || uri.search || uri.hash
    || auth.protocol !== 'http:' || !['auth-service', 'localhost', '127.0.0.1'].includes(auth.hostname)) throw new Error('Demo requires isolated local services');
  const file = process.env.DEMO_SERVICE_KEY_FILE;
  if (!file) throw new Error('Demo service credential file required');
  const encoded = readFileSync(file, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/i.test(encoded)) throw new Error('Invalid demo service credential file');
  return { instanceId, serviceKey: Buffer.from(encoded, 'hex') };
}
export class DemoIdentityClient implements DemoIdentityReader {
  constructor(private readonly authOrigin: string, private readonly config: DemoIdentityConfig) {}
  async read(id: string) {
    if (!/^[a-f0-9]{24}$/.test(id)) return null;
    try {
      const response = await fetch(this.authOrigin + '/internal/demo/identity', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000),
        headers: { 'Content-Type': 'application/json', 'x-goleve-demo-service': this.config.serviceKey.toString('hex') }, body: JSON.stringify({ id }),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json() as { identity?: { id?: unknown; userType?: unknown } };
      if (!data || Object.keys(data).length !== 1 || !data.identity || Object.keys(data.identity).length !== 2 || data.identity.id !== id
        || !['utilizador', 'profissional'].includes(String(data.identity.userType))) throw new Error('Invalid contract');
      return { id, userType: data.identity.userType as 'utilizador' | 'profissional' };
    } catch { throw new Error('Demo identity confirmation unavailable'); }
  }
}
