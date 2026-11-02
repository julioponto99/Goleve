// Executed only in the separately named integration initializer, never the main MongoDB.
const fs = require('fs');
const instance = process.env.INTEGRATION_INSTANCE;
if (!/^[a-f0-9]{16}$/.test(instance || '')) throw Error('Explicit integration instance required');
const catalogue = JSON.parse(fs.readFileSync('/run/secrets/databases.json', 'utf8'));
if (catalogue.instance !== instance) throw Error('Database catalogue belongs to another instance');
let admin;
for (let i = 0; i < 90; i++) {
  try {
    admin = new Mongo('mongodb://mongodb:27017/admin').getDB('admin');
    if (!admin.auth(process.env.MONGO_INITDB_ROOT_USERNAME, process.env.MONGO_INITDB_ROOT_PASSWORD)) throw Error('Initialization authentication unavailable');
    break;
  } catch { if (i === 89) throw Error('Integration MongoDB unavailable'); sleep(1000); }
}
try {
  let status;
  try { status = admin.runCommand({ replSetGetStatus: 1 }); }
  catch (error) { if (error.code !== 94) throw error; status = { ok: 0, code: 94 }; }
  if (status.ok && status.set !== 'goleveIntegrationV1') throw Error('Refusing another replica set');
  if (!status.ok) {
    if (status.code !== 94) throw Error('Replica status unavailable');
    const result = admin.runCommand({ replSetInitiate: { _id: 'goleveIntegrationV1', members: [{ _id: 0, host: 'mongodb:27017' }] } });
    if (!result.ok) throw Error('Replica initialization refused');
  }
  let primary = false;
  for (let i = 0; i < 90; i++) { const h = admin.runCommand({ hello: 1 }); if (h.setName === 'goleveIntegrationV1' && h.isWritablePrimary) { primary = true; break; } sleep(1000); }
  if (!primary) throw Error('Replica primary unavailable');
  for (const entry of catalogue.databases) {
    if (!/^[a-z0-9_]+$/.test(entry.database) || !entry.database.includes(instance) || !entry.username.startsWith('integration_') || !/^[a-f0-9]{64}$/.test(entry.password)) throw Error('Invalid isolated database entry');
    const target = admin.getSiblingDB(entry.database), existing = target.getUser(entry.username);
    if (!existing) target.createUser({ user: entry.username, pwd: entry.password, roles: [{ role: 'readWrite', db: entry.database }] });
    else if (existing.roles.length !== 1 || existing.roles[0].role !== 'readWrite' || existing.roles[0].db !== entry.database) throw Error('Existing database identity does not match');
  }
  print('Integration replica set and isolated service identities ready');
} catch { throw Error('Integration initialization failed; no existing identities were modified'); }
