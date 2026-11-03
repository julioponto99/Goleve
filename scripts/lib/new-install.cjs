'use strict';
// Fresh resources only; never reuse an unowned volume or bypass migration backup guards.
function assertEmptyStandalone(admin){const names=admin.runCommand({listDatabases:1,nameOnly:true});if(names.ok!==1||names.databases.some(d=>!['admin','config','local'].includes(d.name)))throw Error('Existing application data requires the backup/migration procedure');for(const collection of ['system.users','system.roles']){const c=admin.runCommand({count:collection,query:{}});if(c.ok!==1||c.n!==0)throw Error('Existing administrative data requires migration');}return true;}
function initializeEmptyReplica(admin,pause=()=>{},emptyVolumeVerified=false) {
 const expected='goleveV1';let initiated=false;
 const initial=admin.runCommand({hello:1});
 if(initial.setName&&initial.setName!==expected)throw Error('Unexpected replica set');
 let missing=false;
 try{const status=admin.runCommand({replSetGetStatus:1});if(status.ok!==1){if(status.code===94)missing=true;else throw Error('Replica status failed');}}
 catch(e){if(e.code===94||e.codeName==='NotYetInitialized')missing=true;else throw e;}
 if(missing){
  if(!emptyVolumeVerified)throw Error('Fresh standalone data inspection required before replica initialization');
  const result=admin.runCommand({replSetInitiate:{_id:expected,members:[{_id:0,host:'mongodb:27017'}]}});if(result.ok!==1)throw Error('Fresh replica initialization failed');initiated=true;
 }
 for(let i=0;i<60;i++){
  const h=admin.runCommand({hello:1});if(h.setName===expected&&h.isWritablePrimary){const st=admin.runCommand({replSetGetStatus:1});if(st.ok!==1||st.members.length!==1||st.members[0].name!=='mongodb:27017')throw Error('Unexpected replica members');return{replicaSet:expected,primary:true,initiated};}pause(1000);
 }
 throw Error('Primary election timeout');
}
function resourceNames(project){if(!/^[a-z0-9][a-z0-9_-]{0,47}$/.test(project))throw Error('Invalid project name');return{network:project+'_backend',mongo:project+'_mongo_data',rabbit:project+'_rabbitmq_data'};}
module.exports={assertEmptyStandalone,initializeEmptyReplica,resourceNames};
