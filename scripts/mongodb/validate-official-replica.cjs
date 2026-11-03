'use strict';
// Administrative verification only. No application writes, seeds or restarts.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const { inventoryJs, sameInventory } = require('./consolidation-backup.cjs');
const { services, assertIgnored } = require('../local-runtime.cjs');
const dotenv = require('../../backend/node_modules/dotenv');
const root = path.resolve(__dirname, '../..');
function docker(args, input) {
  const p = cp.spawnSync('docker', args, { input, encoding: 'utf8', windowsHide: true, timeout: 30000, maxBuffer: 4e6 });
  if (p.status !== 0) throw Error('MongoDB validation command failed; no application services were started');
  return p.stdout.trim();
}
function shell(id, script) { return JSON.parse(docker(['exec', '-i', id, 'mongosh', '--quiet', '--file', '/dev/stdin'], script)); }
function compareOriginal(before, after) {
  for (const d of before) for (const collection of d.collections) {
    if (!sameInventory(collection, after.find(x => x.name === d.name)?.collections.find(x => x.name === collection.name))) throw Error('An original collection, document hash or index differs');
  }
  const additions = after.flatMap(d => d.collections.filter(c => !before.find(b => b.name === d.name)?.collections.some(b => b.name === c.name)).map(c => ({ database: d.name, collection: c.name })));
  if (additions.some(a => a.database !== 'admin' || a.collection !== 'system.keys')) throw Error('Unexpected collection was added');
  return { originalCollectionsUnchanged: true, expectedReplicaMetadataAdditions: additions };
}
function transactionScript(authCollection, agendaCollection) {
  return `const admin=db.getSiblingDB('admin'), hello=admin.runCommand({hello:1});
if(hello.setName!=='goleveV1'||!hello.isWritablePrimary)throw Error('Primary required');
const initial=admin.runCommand({serverStatus:1}).transactions;
const session=db.getMongo().startSession({causalConsistency:false});
let committed=false,aborted=false;
try{
 session.startTransaction({readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
 const first=session.getDatabase('goleve_auth').getCollection(${JSON.stringify(authCollection)}).countDocuments({});
 const second=session.getDatabase('goleve_agenda').getCollection(${JSON.stringify(agendaCollection)}).countDocuments({});
 session.commitTransaction();committed=true;
 session.startTransaction({readConcern:{level:'snapshot'},writeConcern:{w:'majority'},readPreference:'primary'});
 session.getDatabase('goleve_auth').getCollection(${JSON.stringify(authCollection)}).countDocuments({});
 session.abortTransaction();aborted=true;
 const final=admin.runCommand({serverStatus:1}).transactions;
 const commitDelta=Number(final.totalCommitted)-Number(initial.totalCommitted),abortDelta=Number(final.totalAborted)-Number(initial.totalAborted);
 if(commitDelta<1||abortDelta<1)throw Error('Server did not confirm transactions');
 print(JSON.stringify({snapshotReadCommitted:committed,snapshotReadAborted:aborted,serverCommitDelta:commitDelta,serverAbortDelta:abortDelta,applicationWrites:0,testDocumentsCreated:0,observedCounts:{auth:first,agenda:second}}));
}finally{session.endSession();}`;
}
function validate(backupDirectory) {
  const dir = path.resolve(backupDirectory);
  if (!dir.startsWith(path.join(root, 'protected-backups/local-runtime') + path.sep)) throw Error('Unrecognized backup location');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (!manifest.complete || !manifest.restoreValidated) throw Error('Verified complete backup and restore required');
  const c = JSON.parse(docker(['inspect', 'goleve-mongodb-1']))[0], labels = c.Config.Labels || {};
  if (labels['com.docker.compose.project'] !== 'goleve' || labels['com.docker.compose.service'] !== 'mongodb'
    || path.resolve(labels['com.docker.compose.project.config_files']).toLowerCase() !== path.join(root, 'compose.yaml').toLowerCase()
    || !c.Mounts.some(m => m.Name === 'goleve_mongo_data' && m.Destination === '/data/db') || c.State.Status !== 'running') throw Error('Official MongoDB identity mismatch');
  const active = docker(['ps', '--format', '{{.Names}}']).split(/\r?\n/).filter(Boolean);
  if (active.length !== 1 || active[0] !== 'goleve-mongodb-1') throw Error('Other resources unexpectedly active');
  const before = shell(c.Id, inventoryJs), integrity = compareOriginal(manifest.inventory, before);
  const links = services.map(([service]) => {
    const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend/services', service + '-service/.env')));
    const url = new URL(env.MONGO_URI);
    if (url.hostname !== 'mongodb' || url.searchParams.get('replicaSet') !== 'goleveV1') throw Error('Service URI replica contract mismatch');
    return { service, uri: env.MONGO_URI };
  });
  const connections = shell(c.Id, `const links=${JSON.stringify(links)};print(JSON.stringify(links.map(x=>{const connection=new Mongo(x.uri),target=connection.getDB(new URL(x.uri).pathname.slice(1)),h=target.getSiblingDB('admin').runCommand({hello:1});if(h.setName!=='goleveV1'||!h.isWritablePrimary||!target.runCommand({ping:1}).ok)throw Error('Connection refused');return{service:x.service,database:target.getName(),connected:true,replicaSet:h.setName};})));`);
  const auth = manifest.inventory.find(d => d.name === 'goleve_auth')?.collections[0]?.name;
  const agenda = manifest.inventory.find(d => d.name === 'goleve_agenda')?.collections[0]?.name;
  if (!auth || !agenda) throw Error('Existing collections required for non-writing transaction probe');
  const transactions = shell(c.Id, transactionScript(auth, agenda));
  compareOriginal(manifest.inventory, shell(c.Id, inventoryJs));
  const state = shell(c.Id, "const s=db.getSiblingDB('admin').runCommand({replSetGetStatus:1});print(JSON.stringify({set:s.set,members:s.members.map(m=>({name:m.name,state:m.stateStr,health:m.health}))}));");
  const report = { verifiedAt: new Date().toISOString(), containerId: c.Id, originalVolume: 'goleve_mongo_data', integrity, connections, transactions, state, otherContainersStarted: 0 };
  const file = path.join(root, '.local/mongo-replica-validation.json'); assertIgnored(root, file);
  fs.writeFileSync(file, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
}
if (require.main === module) {
  try { validate(process.argv[2] || ''); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { compareOriginal, transactionScript };
