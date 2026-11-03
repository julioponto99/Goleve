// Explicit post-backup installation operation; not run automatically on startup.
function initializeOfficialReplica(admin, pause) {
  const expected = 'goleveV1';
  const first = admin.runCommand({ hello: 1 });
  if (first.setName && first.setName !== expected) throw Error('Unexpected existing replica set; reconfiguration refused');
  let initiated = false;
  if (!first.setName) {
    let uninitialized = false;
    try {
      const status = admin.runCommand({ replSetGetStatus: 1 });
      uninitialized = status.code === 94;
    } catch (error) {
      // mongosh throws for command errors, including this expected fresh state.
      if (error.code !== 94) throw Error('Replica status check failed; initialization refused');
      uninitialized = true;
    }
    if (!uninitialized) throw Error('Unknown replica state; initialization refused');
    const result = admin.runCommand({ replSetInitiate: { _id: expected, members: [{ _id: 0, host: 'mongodb:27017' }] } });
    if (!result.ok) throw Error('Replica initialization refused');
    initiated = true;
  }
  for (let i = 0; i < 30; i++) {
    const hello = admin.runCommand({ hello: 1 });
    if (hello.setName === expected && hello.isWritablePrimary) {
      const status = admin.runCommand({ replSetGetStatus: 1 });
      if (status.members.length !== 1 || status.members[0].name !== 'mongodb:27017') throw Error('Unexpected replica membership');
      return { replicaSet: expected, primary: true, members: 1, initiated };
    }
    pause(1000);
  }
  throw Error('Primary election timed out; do not start application writers');
}
if (typeof module !== 'undefined') module.exports = { initializeOfficialReplica };
if (typeof db !== 'undefined') {
  if (process.env.GOLEVE_RS_INIT_ACK !== 'backup-and-restore-verified') throw Error('Explicit verified backup acknowledgment required');
  print(JSON.stringify(initializeOfficialReplica(db.getSiblingDB('admin'), sleep)));
}
