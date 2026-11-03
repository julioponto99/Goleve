'use strict';
// Dry-run by default. No collections/documents are deleted or rewritten.
const {isDeepStrictEqual}=require('node:util');
const OLD={name:'ownerId_1_confirmationKey_1',key:{ownerId:1,confirmationKey:1},unique:true,sparse:true};
const NEW={name:'ownerId_confirmationKey_valid_unique_v2',key:{ownerId:1,confirmationKey:1},unique:true,partialFilterExpression:{confirmationKey:{$type:'string'}}};
function same(index,spec){return !!index&&Object.entries(spec).every(([k,v])=>isDeepStrictEqual(k==='key'?Object.entries(index[k]||{}):index[k],k==='key'?Object.entries(v):v));}
async function compatibility(db){
 const collection=db.collection('payments');
 const invalid=await collection.aggregate([{$match:{confirmationKey:{$exists:true}}},{$project:{bad:{$cond:[{$eq:[{$type:'$confirmationKey'},'string']},{$not:[{$regexMatch:{input:'$confirmationKey',regex:'^[A-Za-z0-9._-]{1,128}$'}}]},true]}}},{$match:{bad:true}},{$count:'count'}]).toArray();
 const duplicates=await collection.aggregate([{$match:{confirmationKey:{$type:'string'}}},{$group:{_id:{owner:'$ownerId',key:'$confirmationKey'},count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray();
 const rollback=await collection.aggregate([{$group:{_id:{owner:'$ownerId',key:{$ifNull:['$confirmationKey',null]}},count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray();
 let critical=0;for(const name of ['payments','appointment_payments'])critical+=await db.collection(name).countDocuments({$or:[{state:{$in:['processing','unknown']}},{'bankAttempt.status':{$in:['processing','unknown']}}]});
 return{incompatible:invalid[0]?.count||0,duplicateGroups:duplicates[0]?.count||0,legacyRollbackCollisionGroups:rollback[0]?.count||0,critical};
}
async function audit(db){
 const indexes=await db.collection('payments').listIndexes().toArray(),{incompatible,duplicateGroups,legacyRollbackCollisionGroups,critical}=await compatibility(db);
 const old=indexes.find(i=>i.name===OLD.name),next=indexes.find(i=>i.name===NEW.name);
 if(old&&!same(old,OLD)||next&&!same(next,NEW))throw Error('Named index differs from the reviewed specification');
 if(!old&&!next)throw Error('Neither reviewed index exists; refuse an unexpected installation');
 return {collection:db.databaseName+'.payments',indexes,oldIndexPresent:!!old,newIndexPresent:!!next,incompatible,duplicateGroups,legacyRollbackCollisionGroups,critical,ready:!incompatible&&!duplicateGroups&&!critical,alreadyApplied:!old&&!!next};
}
async function migrate(db,{apply=false,exclusiveMaintenance=false,verifiedBackup=false,checkpoint=async()=>{}}={}){
 const before=await audit(db);await checkpoint({phase:'planned',...before});
 if(!apply)return before;
 if(!exclusiveMaintenance||!verifiedBackup)throw Error('Verified backup and exclusive Payment maintenance acknowledgment required');
 if(!before.ready)throw Error('Incompatible data, duplicate keys or critical processing; no index changes permitted');
 if(before.alreadyApplied)return{...before,changed:false};
 const c=db.collection('payments');
 // The old index remains while the replacement is built: valid keys never lose protection.
 if(!before.newIndexPresent){const {key,...options}=NEW;await c.createIndex(key,options);}
 const protectedState=await audit(db);if(!protectedState.ready||!protectedState.newIndexPresent)throw Error('Replacement not verified; original index retained');
 await checkpoint({phase:'replacement-verified',...protectedState});
 if(protectedState.oldIndexPresent)await c.dropIndex(OLD.name);
 const after=await audit(db);if(!after.alreadyApplied||!after.ready)throw Error('Post-migration verification failed; preserve evidence and keep Payment drained');
 await checkpoint({phase:'completed',...after});return{...after,changed:true};
}
async function cli(){
 const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
 const args=process.argv.slice(2);if(args.some(a=>!['--plan','--apply','--official'].includes(a))||args.includes('--plan')&&args.includes('--apply'))throw Error('Use --plan or --apply [--official]');
 const uri=new URL(process.env.PAYMENT_INDEX_MIGRATION_URI||process.env.MONGO_URI||''),official=args.includes('--official'),apply=args.includes('--apply');
 if(official){if(uri.pathname!=='/goleve_payment'||uri.searchParams.get('replicaSet')!=='goleveV1'||!['mongodb','127.0.0.1'].includes(uri.hostname))throw Error('Official owner URI mismatch');}
 else if(uri.hostname!=='127.0.0.1'||!/^\/goleve_payment_index_test_[a-f0-9]{16}$/.test(uri.pathname)||uri.username||uri.password)throw Error('Explicit isolated fictional test URI required');
 if(apply&&process.env.PAYMENT_INDEX_MIGRATION_ACK!==(official?'authorized-official-confirmation-index-v2':'isolated-confirmation-index-v2'))throw Error('Explicit migration authorization missing');
 let verifiedBackup=!official;
 if(official&&apply){const crypto=require('node:crypto'),dir=path.resolve(process.env.PAYMENT_INDEX_BACKUP_DIRECTORY||''),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),hash=crypto.createHash('sha256');if(path.basename(manifest.archive)!==manifest.archive)throw Error('Invalid backup archive path');for await(const chunk of fs.createReadStream(path.join(dir,manifest.archive)))hash.update(chunk);const keyFile=process.env.PAYMENT_INDEX_BACKUP_KEY_FILE||path.resolve(__dirname,'../../../..',manifest.keyFile||'missing-backup-key');verifiedBackup=!!(manifest.complete&&manifest.restoreValidated&&hash.digest('hex')===manifest.sha256&&fs.existsSync(keyFile));}
 const mongoose=createRequire(path.join(__dirname,'../package.json'))('mongoose');
 const connection=await mongoose.createConnection(uri.toString(),{serverSelectionTimeoutMS:5000,autoIndex:false}).asPromise();
 try{const result=await migrate(connection.db,{apply,verifiedBackup,exclusiveMaintenance:process.env.PAYMENT_INDEX_MAINTENANCE==='payment-writes-drained',checkpoint:async record=>{if(apply){const destination=process.env.PAYMENT_INDEX_EVIDENCE_FILE;if(!destination)throw Error('Protected migration evidence file required before any index change');fs.appendFileSync(destination,JSON.stringify({at:new Date().toISOString(),...record})+'\n',{mode:0o600});}}});console.log(JSON.stringify({...result,indexes:result.indexes.map(i=>({name:i.name,key:i.key,unique:i.unique,sparse:i.sparse,partialFilterExpression:i.partialFilterExpression}))}));}
 finally{await connection.close();}
}
module.exports={OLD,NEW,compatibility,audit,migrate,same};
if(require.main===module)cli().catch(()=>{console.error('Payment index migration refused or interrupted. Preserve evidence and keep writes drained; no documents were rewritten.');process.exitCode=1;});
