import { readFileSync } from 'node:fs';
export interface DemoConfig { instanceId: string; databaseName: string; serviceKey: Buffer }
export function loadDemoConfig(): DemoConfig | undefined {
  const mode = process.env.GOLEVE_DEMO_MODE || 'disabled';
  if (mode === 'disabled') return undefined;
  if (mode !== 'isolated' || !['development', 'test'].includes(process.env.NODE_ENV || '')) throw new Error('Isolated demo configuration is not permitted');
  const instanceId = process.env.DEMO_INSTANCE_ID || '';
  if (!/^[a-f0-9]{16}$/.test(instanceId)) throw new Error('Invalid isolated demo instance');
  const uri = new URL(process.env.MONGO_URI || '');
  const databaseName = 'goleve_demo_' + instanceId + '_auth';
  if (uri.protocol !== 'mongodb:' || !['mongodb', 'localhost', '127.0.0.1'].includes(uri.hostname)
    || uri.pathname !== '/' + databaseName || uri.username || uri.password || uri.search || uri.hash) throw new Error('Demo requires its own local Auth database');
  const file = process.env.DEMO_SERVICE_KEY_FILE;
  if (!file) throw new Error('Demo service credential file is required');
  const encoded = readFileSync(file, 'utf8').trim();
  if (!/^[a-f0-9]{64}$/i.test(encoded)) throw new Error('Invalid demo service credential file');
  return { instanceId, databaseName, serviceKey: Buffer.from(encoded, 'hex') };
}
