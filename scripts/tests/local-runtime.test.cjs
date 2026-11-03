'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { appendMissing, environmentInventory, assertIgnored, services } = require('../local-runtime.cjs');
const { sameInventory } = require('../mongodb/consolidation-backup.cjs');
function fixture(t) {
  const base = fs.realpathSync(os.tmpdir()), dir = fs.mkdtempSync(path.join(base, 'goleve-runtime-unit-'));
  t.after(() => { const resolved = fs.realpathSync(dir); if (path.dirname(resolved) !== base || !path.basename(resolved).startsWith('goleve-runtime-unit-')) throw Error('Unsafe test cleanup'); fs.rmSync(resolved, { recursive: true }); });
  return dir;
}
test('preserves existing bytes, credentials and comments; adds only missing keys', t => {
  const f = path.join(fixture(t), '.env'), original = '# existing\r\nTOKEN="private-fixture-value"\r\nEMPTY=\r\n'; fs.writeFileSync(f, original);
  const r = appendMissing(f, { TOKEN: 'replacement-refused', EMPTY: 'not-overwritten', NEW: 'value with space' });
  assert.equal(r.values.TOKEN, 'private-fixture-value'); assert.equal(r.values.EMPTY, ''); assert.equal(r.added, 1); assert.ok(fs.readFileSync(f, 'utf8').startsWith(original));
});
test('preparation is idempotent and does not rewrite config', t => {
  const f = path.join(fixture(t), '.env'); appendMissing(f, { A: 'one' }); const before = fs.readFileSync(f);
  assert.equal(appendMissing(f, { A: 'two' }).added, 0); assert.deepEqual(fs.readFileSync(f), before);
});
test('existing empty env files are supported', t => { const f = path.join(fixture(t), '.env'); fs.writeFileSync(f, ''); assert.equal(appendMissing(f, { A: 'one' }).added, 1); });
test('duplicate keys fail closed before writing', t => {
  const f = path.join(fixture(t), '.env'), original = 'A=one\nA=two\n'; fs.writeFileSync(f, original);
  assert.throws(() => appendMissing(f, { B: 'three' }), /Duplicate/); assert.equal(fs.readFileSync(f, 'utf8'), original);
});
test('failed validation never replaces existing insecure values', t => {
  const f = path.join(fixture(t), '.env'); fs.writeFileSync(f, 'A=existing\n');
  assert.throws(() => appendMissing(f, { A: 'replacement', B: 'new' }, () => { throw Error('Refused'); })); assert.equal(fs.readFileSync(f, 'utf8'), 'A=existing\n');
});
test('environment audit reports names only, excludes private trees and templates are not operational', t => {
  const dir = fixture(t); fs.writeFileSync(path.join(dir, '.env'), 'PASSWORD=private-value\n'); fs.writeFileSync(path.join(dir, '.env.example'), 'TEMPLATE=placeholder\n');
  fs.mkdirSync(path.join(dir, '.secrets')); fs.writeFileSync(path.join(dir, '.secrets', '.env'), 'KEY=must-not-read\n');
  const r = environmentInventory(dir); assert.equal(r.length, 2); assert.equal(r.find(x => x.operational).file, '.env'); assert.ok(!JSON.stringify(r).includes('private-value')); assert.ok(!JSON.stringify(r).includes('must-not-read'));
});
test('sensitive outputs outside repository are refused', () => {
  const root = path.resolve(__dirname, '../..'); assert.throws(() => assertIgnored(root, path.resolve(root, '../unrelated.env')), /outside/);
});
test('exactly eleven distinct service owners and logical database suffixes', () => {
  assert.equal(services.length, 11); for (const i of [0, 1, 2]) assert.equal(new Set(services.map(s => s[i])).size, 11);
});
test('restore comparison detects lost documents and altered index constraints', () => {
  const original = [{ name: 'db', collections: [{ name: 'items', count: 2, contentSha256: 'hash', indexes: [{ name: 'email_1', key: { email: 1 }, unique: true }] }] }];
  const x = structuredClone(original); assert.ok(sameInventory(original, x)); x[0].collections[0].count--; assert.ok(!sameInventory(original, x));
  const y = structuredClone(original); y[0].collections[0].indexes[0].unique = false; assert.ok(!sameInventory(original, y));
});
test('restore comparison is stable across object property order', () => assert.ok(sameInventory([{ a: 1, b: 2 }], [{ b: 2, a: 1 }])));
test('restore comparison preserves compound index key order', () => {
  assert.ok(!sameInventory([{ key: { ownerId: 1, createdAt: -1 } }], [{ key: { createdAt: -1, ownerId: 1 } }]));
});

const { compareOriginal } = require('../mongodb/validate-official-replica.cjs');
test('conversion comparison permits only added replica system keys, preserving original collections', () => {
  const original = [{ name: 'admin', collections: [{ name: 'system.version', count: 1, contentSha256: 'unchanged', indexes: [] }] }, { name: 'goleve_auth', collections: [{ name: 'auth_users', count: 3, contentSha256: 'unchanged', indexes: [] }] }];
  const current = structuredClone(original); current[0].collections.push({ name: 'system.keys', count: 2, indexes: [] });
  assert.equal(compareOriginal(original, current).originalCollectionsUnchanged, true);
  current[1].collections[0].contentSha256 = 'changed'; assert.throws(() => compareOriginal(original, current), /differs/);
});
test('conversion comparison rejects unexplained collections', () => {
  assert.throws(() => compareOriginal([], [{ name: 'goleve_auth', collections: [{ name: 'unexpected' }] }]), /Unexpected/);
});

const { initializeOfficialReplica } = require('../mongodb/initialize-official-replica.js');
test('replica initialization handles mongosh NotYetInitialized exception and initiates once', () => {
  let calls = 0, active = false;
  const admin = { runCommand(c) {
    if (c.hello) return active ? { setName: 'goleveV1', isWritablePrimary: true } : {};
    if (c.replSetGetStatus) { if (!active) throw Object.assign(Error('expected'), { code: 94 }); return { members: [{ name: 'mongodb:27017' }] }; }
    if (c.replSetInitiate) { calls++; active = true; return { ok: 1 }; }
    throw Error('Unexpected command');
  } };
  assert.equal(initializeOfficialReplica(admin, () => {}).initiated, true); assert.equal(calls, 1);
  assert.equal(initializeOfficialReplica(admin, () => {}).initiated, false); assert.equal(calls, 1);
});
test('replica status failures do not initiate or reconfigure', () => {
  const admin = { runCommand(c) { if (c.hello) return {}; if (c.replSetGetStatus) throw Object.assign(Error(), { code: 13 }); throw Error('Mutation must not run'); } };
  assert.throws(() => initializeOfficialReplica(admin, () => {}), /initialization refused/);
  assert.throws(() => initializeOfficialReplica({ runCommand() { return { setName: 'other' }; } }, () => {}), /Unexpected existing/);
});
