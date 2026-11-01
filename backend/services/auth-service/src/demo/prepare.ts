import 'dotenv/config';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { loadDemoConfig } from './config';
import { DemoPreparation } from './models';
import { AuthUser } from '../models/auth-user.model';
import { getJwtSecret } from '../config/token';
interface Fixture { id: string; name: string; email: string; password: string; userType: 'utilizador' | 'profissional'; kind: string }
export function validateFixtureManifest(value: unknown, instanceId: string): { instanceId: string; expiresAt: Date; accounts: Fixture[] } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid fixture manifest');
  const data = value as Record<string, unknown>;
  if (Object.keys(data).some((key) => !['instanceId', 'expiresAt', 'accounts'].includes(key)) || data.instanceId !== instanceId
    || typeof data.expiresAt !== 'string' || !Array.isArray(data.accounts) || data.accounts.length !== 4) throw new Error('Invalid fixture manifest');
  const expiresAt = new Date(data.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 24 * 3600000) throw new Error('Invalid fixture lifetime');
  const kinds = ['user_a', 'user_b', 'personal_trainer', 'nutritionist'];
  const accounts = data.accounts as Fixture[];
  for (const account of accounts) {
    if (!account || typeof account !== 'object' || Object.keys(account).some((key) => !['id', 'name', 'email', 'password', 'userType', 'kind'].includes(key))
      || !kinds.includes(account.kind) || !/^[a-f0-9]{24}$/.test(account.id) || account.email !== account.kind + '-' + instanceId + '@example.invalid'
      || account.name !== 'Synthetic Demo ' + account.kind || account.userType !== (account.kind.startsWith('user_') ? 'utilizador' : 'profissional')
      || typeof account.password !== 'string' || !/^[A-Za-z0-9_-]{32,64}$/.test(account.password)) throw new Error('Invalid fictional account specification');
  }
  if (new Set(accounts.map((a) => a.kind)).size !== 4 || new Set(accounts.map((a) => a.id)).size !== 4) throw new Error('Duplicate fixture accounts');
  return { instanceId, expiresAt, accounts };
}
export async function prepareDemoIdentities(): Promise<number> {
  const config = loadDemoConfig(); if (!config || process.env.DEMO_PREPARE_ACK !== 'create-new-fictional-identities') throw new Error('Explicit isolated demo preparation required');
  getJwtSecret();
  const file = process.env.DEMO_FIXTURES_FILE; if (!file) throw new Error('Fixture manifest file required');
  const manifest = validateFixtureManifest(JSON.parse(readFileSync(file, 'utf8')), config.instanceId);
  await mongoose.connect(process.env.MONGO_URI!, { serverSelectionTimeoutMS: 5000 });
  if (mongoose.connection.db?.databaseName !== config.databaseName) throw new Error('Unexpected Auth database');
  await AuthUser.init(); await DemoPreparation.init();
  const existing = await AuthUser.find().select('+passwordHash +demoInstanceId');
  const marker = await DemoPreparation.findOne({ instanceId: config.instanceId });
  // Validate every existing identity before inserting anything; never adopt or update unknown accounts.
  for (const account of existing) {
    const fixture = manifest.accounts.find((f) => f.id === account._id.toHexString());
    if (!fixture || account.demoInstanceId !== config.instanceId || account.name !== fixture.name || account.email !== fixture.email
      || account.userType !== fixture.userType || !await bcrypt.compare(fixture.password, account.passwordHash)) throw new Error('Existing identity differs from approved fixture; nothing may be overwritten');
  }
  if (marker && (marker.expiresAt.getTime() !== manifest.expiresAt.getTime() || existing.length !== 4
    || marker.identityIds.length !== 4 || !manifest.accounts.every((a) => marker.identityIds.includes(a.id)))) throw new Error('Existing preparation differs; use a new isolated instance');
  let created = 0;
  for (const fixture of manifest.accounts) {
    if (existing.some((account) => account._id.toHexString() === fixture.id)) continue;
    await AuthUser.create({ _id: fixture.id, name: fixture.name, email: fixture.email, userType: fixture.userType,
      passwordHash: await bcrypt.hash(fixture.password, 12), demoInstanceId: config.instanceId }); created++;
  }
  if (!marker) await DemoPreparation.create({ instanceId: config.instanceId, source: 'explicit_local_cli', fixtureCount: 4, identityIds: manifest.accounts.map((a) => a.id), preparedAt: new Date(), expiresAt: manifest.expiresAt });
  return created;
}
if (require.main === module) {
  prepareDemoIdentities().then((created) => console.log(JSON.stringify({ prepared: true, createdIdentities: created, administrators: 0 })))
    .catch(() => { console.error('Demo preparation refused; check explicit scope, manifest and isolated database'); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
