'use strict';
// Binary streaming, authenticated encryption, no clear archive on disk.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { pipeline } = require('node:stream/promises');
const { assertIgnored } = require('../local-runtime.cjs');
const root = path.resolve(__dirname, '../..');
const sourceName = 'goleve-mongodb-1';
function docker(args, input) {
  const r = cp.spawnSync('docker', args, { input, encoding: 'utf8', windowsHide: true, maxBuffer: 4e6 });
  if (r.status !== 0) throw Error('Docker operation failed; no conversion is permitted'); return r.stdout;
}
function inspect(name) { return JSON.parse(docker(['inspect', name]))[0]; }
function assertSource() {
  const c = inspect(sourceName), l = c.Config.Labels || {};
  if (l['com.docker.compose.project'] !== 'goleve' || l['com.docker.compose.service'] !== 'mongodb'
    || path.resolve(l['com.docker.compose.project.config_files'] || '').toLowerCase() !== path.join(root, 'compose.yaml').toLowerCase()
    || !c.Mounts.some(m => m.Name === 'goleve_mongo_data' && m.Destination === '/data/db') || c.State.Status !== 'running') throw Error('Official source identity or volume mismatch');
  return c;
}
const inventoryJs = `const crypto=require('crypto'),admin=db.getSiblingDB('admin');
const names=admin.runCommand({listDatabases:1,nameOnly:true}).databases.map(x=>x.name).filter(x=>!['local','config'].includes(x)).sort();
const result=names.map(name=>{const d=db.getSiblingDB(name);return{name,collections:d.getCollectionInfos().filter(x=>x.type!=='view').sort((a,b)=>a.name.localeCompare(b.name)).map(info=>{const col=d.getCollection(info.name),hash=crypto.createHash('sha256');let count=0;col.find().sort({_id:1}).forEach(row=>{hash.update(EJSON.stringify(row,{relaxed:false}));hash.update('\\n');count++;});return{name:info.name,options:info.options,count,contentSha256:hash.digest('hex'),indexes:col.getIndexes().sort((a,b)=>a.name.localeCompare(b.name))};})};});print(JSON.stringify(result));`;
function inventory(container) { return JSON.parse(docker(['exec', container, 'mongosh', '--quiet', '--eval', inventoryJs]).trim().split(/\r?\n/).pop()); }
function child(args) {
  const p = cp.spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  p.stderr.resume(); // Never log database error text or possible document values.
  const ended = new Promise((resolve, reject) => { p.once('error', reject); p.once('close', n => n === 0 ? resolve() : reject(Error('Database archive command failed'))); });
  // Mark as handled immediately; the original promise is still awaited below.
  ended.catch(() => {}); return { p, ended };
}
function ordered(value, parent) {
  if (Array.isArray(value)) return value.map(item => ordered(item));
  // Compound index field order is semantic; do not normalize it away.
  if (value && typeof value === 'object') {
    if (parent === 'key') return { orderedIndexKey: Object.entries(value) };
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, ordered(value[k], k)]));
  }
  return value;
}
function sameInventory(a, b) { return JSON.stringify(ordered(a)) === JSON.stringify(ordered(b)); }
// Only authorized exception: mongodump excludes replica signing metadata admin.system.keys.
// Preserve the original inventory and the strict comparator used elsewhere.
function sameRestoreInventory(expected, actual, excludeReplicaSystemKeys = false) {
  if (!excludeReplicaSystemKeys) return sameInventory(expected, actual);
  const scoped = entries => entries.map(d => ({ ...d, collections: d.collections.filter(c => !(d.name === 'admin' && c.name === 'system.keys')) }));
  return sameInventory(scoped(expected), scoped(actual));
}
async function hashFile(file) { const h = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(file)) h.update(chunk); return h.digest('hex'); }
async function backup() {
  const c = assertSource(), before = inventory(c.Id);
  const dir = path.join(root, 'protected-backups', 'local-runtime', new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex'));
  assertIgnored(root, path.join(dir, 'full.archive.enc'));
  const keyFile = path.join(root, '.secrets/local-runtime/consolidation-backup.key'); assertIgnored(root, keyFile);
  if (!fs.existsSync(keyFile)) { fs.mkdirSync(path.dirname(keyFile), { recursive: true }); fs.writeFileSync(keyFile, crypto.randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 }); }
  const raw = fs.readFileSync(keyFile, 'utf8').trim(); if (!/^[a-f0-9]{64}$/.test(raw)) throw Error('Invalid protected backup key');
  fs.mkdirSync(dir, { recursive: true }); const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(raw, 'hex'), iv);
  cipher.setAAD(Buffer.from('goleve-full-backup-v1'));
  const { p, ended } = child(['exec', c.Id, 'mongodump', '--archive', '--gzip']); p.stdin.end();
  await Promise.all([pipeline(p.stdout, cipher, fs.createWriteStream(path.join(dir, 'full.archive.enc'), { flags: 'wx', mode: 0o600 })), ended]);
  const after = inventory(c.Id); if (!sameInventory(before, after)) throw Error('Source changed during backup; conversion refused');
  const digest = await hashFile(path.join(dir, 'full.archive.enc'));
  const manifest = { version: 1, complete: true, createdAt: new Date().toISOString(), sourceContainer: c.Id, sourceImage: c.Image,
    scope: 'Full mongodump; all application databases and metadata, excluding local replication data. Volatile config sessions are not compared.',
    archive: 'full.archive.enc', algorithm: 'aes-256-gcm', iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex'), sha256: digest,
    keyFile: path.relative(root, keyFile), inventory: before, restoreValidated: false };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ backupDirectory: path.relative(root, dir), encrypted: true, complete: true, databases: before.map(d => ({ name: d.name, collections: d.collections.length, documents: d.collections.reduce((n, v) => n + v.count, 0) })), restoreValidated: false }));
}
async function restore(directory, target) {
  const dir = path.resolve(directory); if (!dir.startsWith(path.join(root, 'protected-backups/local-runtime') + path.sep)) throw Error('Unrecognized backup location');
  const manifestPath = path.join(dir, 'manifest.json'), m = JSON.parse(fs.readFileSync(manifestPath, 'utf8')), c = inspect(target);
  if (!/^goleve-consolidation-restore-[a-f0-9]{12}$/.test(target) || c.Config.Labels?.['goleve.consolidation.restore'] !== 'true'
    || c.HostConfig.PortBindings && Object.keys(c.HostConfig.PortBindings).length || c.Mounts.some(x => x.Type === 'volume' || x.Type === 'bind')
    || !c.HostConfig.Tmpfs?.['/data/db'] || !c.HostConfig.Tmpfs?.['/data/configdb'] || c.State.Status !== 'running') throw Error('Unsafe restore destination');
  if (inventory(c.Id).some(d => d.name !== 'admin')) throw Error('Restore destination already has data; overwrite refused');
  const file = path.join(dir, 'full.archive.enc');
  if (await hashFile(file) !== m.sha256) throw Error('Encrypted backup hash mismatch');
  const keyFile = path.resolve(root, m.keyFile); if (!keyFile.startsWith(path.join(root, '.secrets') + path.sep)) throw Error('Invalid backup key path');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'hex'), Buffer.from(m.iv, 'hex'));
  decipher.setAAD(Buffer.from('goleve-full-backup-v1')); decipher.setAuthTag(Buffer.from(m.tag, 'hex'));
  const { p, ended } = child(['exec', '-i', c.Id, 'mongorestore', '--archive', '--gzip', '--stopOnError']); p.stdout.resume();
  await Promise.all([pipeline(fs.createReadStream(file), decipher, p.stdin), ended]);
  const restored = inventory(c.Id); if (!sameInventory(m.inventory, restored)) throw Error('Restored database/document/index inventory differs; conversion forbidden');
  m.restoreValidated = true; m.restoredAt = new Date().toISOString(); m.restoreContainer = c.Id;
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ restored: true, contentAndIndexesMatch: true, databases: restored.length, targetId: c.Id.slice(0, 12) }));
}
async function verifyRestored(directory, target) {
  if (process.env.GOLEVE_RESTORE_EXCLUSION_ACK !== 'admin.system.keys-only') throw Error('Explicit limited exclusion authorization required');
  const dir = path.resolve(directory); if (!dir.startsWith(path.join(root, 'protected-backups/local-runtime') + path.sep)) throw Error('Unrecognized backup location');
  const manifestPath = path.join(dir, 'manifest.json'), m = JSON.parse(fs.readFileSync(manifestPath, 'utf8')), c = inspect(target);
  if (!/^goleve-consolidation-restore-[a-f0-9]{12}$/.test(target) || c.Config.Labels?.['goleve.consolidation.restore'] !== 'true'
    || c.HostConfig.PortBindings && Object.keys(c.HostConfig.PortBindings).length || c.Mounts.some(x => x.Type === 'volume' || x.Type === 'bind')
    || !c.HostConfig.Tmpfs?.['/data/db'] || !c.HostConfig.Tmpfs?.['/data/configdb'] || c.State.Status !== 'running') throw Error('Unsafe verification destination');
  const file = path.join(dir, 'full.archive.enc'), originalInventoryHash = crypto.createHash('sha256').update(JSON.stringify(m.inventory)).digest('hex');
  if (await hashFile(file) !== m.sha256) throw Error('Encrypted backup hash mismatch');
  const keyFile = path.resolve(root, m.keyFile); if (!keyFile.startsWith(path.join(root, '.secrets') + path.sep)) throw Error('Invalid backup key path');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'hex'), Buffer.from(m.iv, 'hex'));
  decipher.setAAD(Buffer.from('goleve-full-backup-v1')); decipher.setAuthTag(Buffer.from(m.tag, 'hex'));
  const { Writable } = require('node:stream');
  await pipeline(fs.createReadStream(file), decipher, new Writable({ write(_chunk, _encoding, done) { done(); } }));
  const restored = inventory(c.Id);
  if (!sameRestoreInventory(m.inventory, restored, true)) throw Error('Divergence beyond the sole authorized admin.system.keys exclusion');
  const verification = { checkedAt: new Date().toISOString(), readOnly: true, targetId: c.Id, archiveSha256: m.sha256,
    originalInventorySha256: originalInventoryHash, authorizedExcludedNamespace: 'admin.system.keys',
    strictComparisonWithoutExclusion: sameInventory(m.inventory, restored), comparisonWithOnlyAuthorizedExclusion: true,
    applicationDatabases: restored.filter(d => d.name.startsWith('goleve_')).length };
  fs.writeFileSync(path.join(dir, 'restore-verification.json'), JSON.stringify(verification, null, 2), { mode: 0o600 });
  m.restoreValidated = true; m.restoredAt = verification.checkedAt; m.restoreContainer = c.Id; m.restoreExcludedNamespaces = ['admin.system.keys'];
  if (crypto.createHash('sha256').update(JSON.stringify(m.inventory)).digest('hex') !== originalInventoryHash) throw Error('Original inventory changed');
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(verification));
}
if (require.main === module) (async () => {
  if (process.argv[2] === 'backup') await backup(); else if (process.argv[2] === 'restore') await restore(process.argv[3] || '', process.argv[4] || '');
  else if (process.argv[2] === 'verify-restored') await verifyRestored(process.argv[3] || '', process.argv[4] || '');
  else throw Error('Expected backup, restore or verify-restored');
})().catch(() => { console.error('Backup/restore validation failed. No conversion, deletion or source modification was performed. Preserve evidence and diagnose before retrying.'); process.exitCode = 1; });
module.exports = { sameInventory, sameRestoreInventory, inventoryJs };
