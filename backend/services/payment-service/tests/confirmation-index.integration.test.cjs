'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{randomUUID,createHash}=require('node:crypto');
const mongoose=require('mongoose'),amqp=require('amqplib');
const {paymentSchema}=require('../dist/models/payment.model'),{PaymentService}=require('../dist/services/payment.service'),{loadPaymentFixtures}=require('../dist/config/fixtures'),{MockBankProvider}=require('../dist/services/mock-bank.provider'),{publishPaymentOutbox}=require('../dist/events/outbox'),{errorHandler}=require('../dist/middlewares/error.middleware');
const {OLD,NEW,compatibility,audit,migrate}=require('../scripts/migrate-confirmation-index.cjs');
const enabled=process.env.PAYMENT_INDEX_TEST_ACK==='explicit-isolated-index-tests',check=(name,work)=>test(name,{skip:!enabled},work);
const fixtures=loadPaymentFixtures('fix-approve:2500:approve'),ctx=()=>({identity:{id:new mongoose.Types.ObjectId().toHexString(),userType:'utilizador'},requestId:'synthetic-index-test'}),input=reference=>({priceReference:'fix-approve',amountCents:2500,serviceReference:reference||'fictional-service'});
const connections=[],approved={apply:true,exclusiveMaintenance:true,verifiedBackup:true};let connection,peer,models,peerModels,resource;
function model(c,name='Payment'){return{Payment:c.model(name,paymentSchema,'payments')};}
const digest=async c=>createHash('sha256').update(JSON.stringify(await c.find().sort({_id:1}).toArray())).digest('hex');
before(async()=>{
 if(!enabled)return;resource=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../../.local/payment-index-test-resource.json'),'utf8'));
 assert.match(resource.run,/^[a-f0-9]{16}$/);assert.equal(resource.name,'goleve-payment-index-'+resource.run);
 const r=cp.spawnSync('docker',['inspect',resource.id],{encoding:'utf8'});assert.equal(r.status,0);const c=JSON.parse(r.stdout)[0];
 assert.equal(c.Name,'/'+resource.name);assert.equal(c.Config.Labels['goleve.payment-index-test'],resource.run);assert.equal(c.State.Running,true);assert(c.Mounts.every(m=>m.Type==='tmpfs'));assert.deepEqual(Object.keys(c.NetworkSettings.Networks),[resource.network]);assert.equal(c.HostConfig.PortBindings['27017/tcp'][0].HostIp,'127.0.0.1');assert.equal(c.HostConfig.PortBindings['27017/tcp'][0].HostPort,String(resource.port));
 resource.database='goleve_payment_index_test_'+randomUUID().replaceAll('-','').slice(0,16);
 const uri='mongodb://127.0.0.1:'+resource.port+'/'+resource.database;
 connection=await mongoose.createConnection(uri,{autoIndex:false,serverSelectionTimeoutMS:5000}).asPromise();peer=await mongoose.createConnection(uri,{autoIndex:false,serverSelectionTimeoutMS:5000}).asPromise();connections.push(connection,peer);models=model(connection);peerModels=model(peer);
 await connection.db.createCollection('payments');for(const [key,options]of paymentSchema.indexes())if(!key.confirmationKey)await connection.db.collection('payments').createIndex(key,options);
 const {key,...options}=OLD;await connection.db.collection('payments').createIndex(key,options);
});
after(async()=>{await Promise.all(connections.map(c=>c.close()));});
check('reproduces the actual legacy Mongo unique violation and its HTTP 409 mapping',async()=>{
 const service=new PaymentService(models,fixtures),actor=ctx();await service.create(actor,input(),'original-intent');
 let duplicate;try{await service.create(actor,input('second-service'),'new-intent');}catch(e){duplicate=e;}
 assert.equal(duplicate?.code,11000);assert.deepEqual(duplicate.keyPattern,OLD.key);assert.equal(duplicate.keyValue.confirmationKey,null);
 let status,body;errorHandler(duplicate,{method:'POST',path:'/payments'},{locals:{},status(s){status=s;return this;},json(b){body=b;}},()=>assert.fail());assert.equal(status,409);assert.equal(body.error.code,'IDEMPOTENCY_CONFLICT');
 assert.equal(await models.Payment.countDocuments(),1);assert.equal(await models.Payment.countDocuments({bankAttempt:{$exists:true}}),0);
});
check('migration preserves all documents and other indexes, and is repeatable',async()=>{
 const c=connection.db.collection('payments'),before=await digest(c),indexes=await c.indexes(),phases=[];
 const r=await migrate(connection.db,{...approved,checkpoint:async state=>{phases.push(state.phase);if(state.phase==='replacement-verified'){assert(state.oldIndexPresent&&state.newIndexPresent);}}});
 assert.equal(r.changed,true);assert.equal(await digest(c),before);for(const i of indexes.filter(i=>i.name!==OLD.name))assert.deepEqual((await c.indexes()).find(j=>j.name===i.name),i);
 assert.deepEqual(phases,['planned','replacement-verified','completed']);assert.equal((await migrate(connection.db,approved)).changed,false);
 const definition=paymentSchema.indexes().find(([,o])=>o.name===NEW.name);assert.deepEqual(definition,[NEW.key,{name:NEW.name,unique:true,partialFilterExpression:NEW.partialFilterExpression}]);
});
check('first and second legitimate intentions without keys succeed for the same owner',async()=>{
 const actor=ctx(),service=new PaymentService(models,fixtures),a=await service.create(actor,input('first'),'one'),b=await service.create(actor,input('second'),'two');assert.notEqual(a.id,b.id);assert.equal(await models.Payment.countDocuments({ownerId:actor.identity.id,confirmationKey:{$exists:false}}),2);
 assert((await audit(connection.db)).legacyRollbackCollisionGroups>=1);assert.equal((await migrate(connection.db,approved)).changed,false);
});
check('equivalent concurrent creation across two instances returns one payment, mismatched replay is rejected',async()=>{
 const actor=ctx(),a=new PaymentService(models,fixtures),b=new PaymentService(peerModels,fixtures);const r=await Promise.all([a.create(actor,input(),'equivalent'),b.create(actor,input(),'equivalent')]);assert.equal(r[0].id,r[1].id);assert.equal(await models.Payment.countDocuments({ownerId:actor.identity.id}),1);await assert.rejects(a.create(actor,input('changed'),'equivalent'),{code:'IDEMPOTENCY_CONFLICT'});
});
check('valid confirmation is replayable only on its payment; same owner cannot use it for another payment',async()=>{
 const actor=ctx(),other=ctx(),service=new PaymentService(models,fixtures),a=await service.create(actor,input(),'a'),b=await service.create(actor,input(),'b'),c=await service.create(other,input(),'a');let calls=0;const bank=new MockBankProvider(),tracked=new PaymentService(models,fixtures,{authorize(...args){calls++;return bank.authorize(...args);}});
 const first=await tracked.confirm(actor,a.id,'valid-key');assert.equal(first.state,'approved');assert.equal((await tracked.confirm(actor,a.id,'valid-key')).transactionReference,first.transactionReference);assert.equal(calls,1);
 await assert.rejects(tracked.confirm(actor,b.id,'valid-key'),{code:'IDEMPOTENCY_CONFLICT'});assert.equal(calls,1);assert.equal((await tracked.confirm(other,c.id,'valid-key')).state,'approved');assert.equal(calls,2);await assert.rejects(tracked.confirm(actor,a.id,'different-key'),{code:'INVALID_STATE'});
});
check('absent key is valid, explicit null/empty/malformed keys are rejected by schema and API key rules',async()=>{
 const raw={ownerId:ctx().identity.id,...input(),currency:'EUR',state:'pending',method:'mock',idempotencyKey:'test'};await new models.Payment(raw).validate();
 for(const value of [null,'','bad key'])await assert.rejects(new models.Payment({...raw,confirmationKey:value}).validate(),e=>e.name==='ValidationError');
 const actor=ctx(),service=new PaymentService(models,fixtures),p=await service.create(actor,input(),'no-call');for(const key of ['', 'bad key'])await assert.rejects(service.confirm(actor,p.id,key),{code:'INVALID_IDEMPOTENCY_KEY'});
});
check('raw index excludes missing/null values but still protects string values, including empty legacy strings',async()=>{
 const db=connection.useDb(resource.database+'_raw').db,c=db.collection('payments');await db.createCollection('payments');const {key,...options}=NEW;await c.createIndex(key,options);
 await c.insertMany([{ownerId:'fictional',n:1},{ownerId:'fictional',n:2},{ownerId:'fictional',confirmationKey:null,n:3},{ownerId:'fictional',confirmationKey:null,n:4}]);await c.insertOne({ownerId:'fictional',confirmationKey:''});await assert.rejects(c.insertOne({ownerId:'fictional',confirmationKey:''}),e=>e.code===11000);
 const r=await audit(db);assert.equal(r.incompatible,3);await assert.rejects(migrate(db,approved),/Incompatible/);
});
check('duplicate string keys, invalid legacy values and critical operations block migration without touching indexes',async()=>{
 for(const [suffix,docs]of Object.entries({null:[{ownerId:'fictional',confirmationKey:null}],empty:[{ownerId:'fictional',confirmationKey:''}],number:[{ownerId:'fictional',confirmationKey:123}],array:[{ownerId:'fictional',confirmationKey:['a']}],duplicates:[{ownerId:'fictional',confirmationKey:'same'},{ownerId:'fictional',confirmationKey:'same'}],critical:[{ownerId:'fictional',bankAttempt:{status:'processing'}}]})){
  const db=connection.useDb(resource.database+'_'+suffix).db,c=db.collection('payments');await db.createCollection('payments');await c.insertMany(docs);
  if(suffix==='duplicates'){await c.createIndex(OLD.key,{name:'not-reviewed'});assert.equal((await compatibility(db)).duplicateGroups,1);}
  else{const {key,...options}=OLD;await c.createIndex(key,options);const plan=await audit(db);assert.equal(plan.ready,false);assert.equal(suffix==='critical'?plan.critical:plan.incompatible,1);}
  const indexes=await c.indexes(),hash=await digest(c);await assert.rejects(migrate(db,approved));assert.deepEqual(await c.indexes(),indexes);assert.equal(await digest(c),hash);
 }
});
check('failed checkpoint keeps original and replacement protections; a resumed migration completes safely',async()=>{
 const db=connection.useDb(resource.database+'_resume').db,c=db.collection('payments');await db.createCollection('payments');const {key,...options}=OLD;await c.createIndex(key,options);await c.insertOne({ownerId:'fictional'});const hash=await digest(c);
 await assert.rejects(migrate(db,{...approved,checkpoint:async s=>{if(s.phase==='replacement-verified')throw Error('synthetic evidence failure');}}),/synthetic evidence failure/);const r=await audit(db);assert(r.oldIndexPresent&&r.newIndexPresent);assert.equal(await digest(c),hash);assert.equal((await migrate(db,approved)).changed,true);assert.equal(await digest(c),hash);
});
check('dry-run never alters indexes; apply requires backup and drained-write acknowledgments',async()=>{
 const db=connection.useDb(resource.database+'_guard').db,c=db.collection('payments');await db.createCollection('payments');const {key,...options}=OLD;await c.createIndex(key,options);const initial=await c.indexes();await migrate(db);assert.deepEqual(await c.indexes(),initial);await assert.rejects(migrate(db,{apply:true}),/backup/);assert.deepEqual(await c.indexes(),initial);
});
check('CLI defaults to a read-only plan and refuses application without explicit acknowledgments',async()=>{
 const db=connection.useDb('goleve_payment_index_test_'+randomUUID().replaceAll('-','').slice(0,16)).db;await db.createCollection('payments');const {key,...options}=OLD;await db.collection('payments').createIndex(key,options);const before=await db.collection('payments').indexes();
 const environment={...process.env,PAYMENT_INDEX_MIGRATION_URI:'mongodb://127.0.0.1:'+resource.port+'/'+db.databaseName};delete environment.PAYMENT_INDEX_MIGRATION_ACK;
 const script=path.resolve(__dirname,'../scripts/migrate-confirmation-index.cjs');const plan=cp.spawnSync(process.execPath,[script],{env:environment,encoding:'utf8',timeout:15000});assert.equal(plan.status,0);assert.equal(JSON.parse(plan.stdout).oldIndexPresent,true);assert.deepEqual(await db.collection('payments').indexes(),before);
 const denied=cp.spawnSync(process.execPath,[script,'--apply'],{env:environment,encoding:'utf8',timeout:15000});assert.notEqual(denied.status,0);assert.deepEqual(await db.collection('payments').indexes(),before);
 const wrongOfficial=cp.spawnSync(process.execPath,[script,'--official','--apply'],{env:environment,encoding:'utf8',timeout:15000});assert.notEqual(wrongOfficial.status,0);assert.deepEqual(await db.collection('payments').indexes(),before);
});
check('concurrent same-key confirmations of distinct payments acquire one claim and call the bank once',async()=>{
 const actor=ctx(),service=new PaymentService(models,fixtures),a=await service.create(actor,input(),'a'),b=await service.create(actor,input(),'b');let calls=0,enter,release;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r),mock=new MockBankProvider(),bank={async authorize(...args){calls++;enter();await gate;return mock.authorize(...args);}};
 const first=new PaymentService(models,fixtures,bank).confirm(actor,a.id,'exclusive');try{await entered;await assert.rejects(new PaymentService(peerModels,fixtures,bank).confirm(actor,b.id,'exclusive'),{code:'IDEMPOTENCY_CONFLICT'});assert.equal(calls,1);}finally{release();}await first;assert.equal((await models.Payment.findById(b.id)).bankAttempt,undefined);assert.equal((await models.Payment.findById(a.id)).notificationOutbox.length,1);
});
check('same payment concurrent confirmations, recovery and replay do not duplicate charges or events',async()=>{
 const actor=ctx(),service=new PaymentService(models,fixtures),p=await service.create(actor,input(),'single');let calls=0;const mock=new MockBankProvider(),bank={authorize(...args){calls++;return mock.authorize(...args);}};const a=new PaymentService(models,fixtures,bank),b=new PaymentService(peerModels,fixtures,bank),results=await Promise.allSettled([a.confirm(actor,p.id,'same'),b.confirm(actor,p.id,'same')]);assert(results.some(r=>r.status==='fulfilled'));assert.equal(calls,1);assert.equal((await b.confirm(actor,p.id,'same')).state,'approved');assert.equal(calls,1);const doc=await models.Payment.findById(p.id);assert.equal(doc.notificationOutbox.filter(e=>e.type==='payment.simulated.approved.v1').length,1);
});
check('new index preserves timeout fence: unknown result cannot be charged again',async()=>{
 const actor=ctx(),p=await new PaymentService(models,fixtures).create(actor,input(),'timeout');let calls=0;const service=new PaymentService(models,fixtures,{authorize(){calls++;return new Promise(()=>{});}},{bankTimeoutMs:15});await assert.rejects(service.confirm(actor,p.id,'timeout'),{code:'PAYMENT_RECONCILIATION_REQUIRED'});await assert.rejects(service.confirm(actor,p.id,'retry'),{code:'PAYMENT_RECONCILIATION_REQUIRED'});assert.equal(calls,1);const doc=await models.Payment.findById(p.id);assert.equal(doc.notificationOutbox[0].type,'payment.simulated.unknown.v1');
});
check('outbox publisher remains compatible with confirm callbacks and retry using simulated RabbitMQ',async()=>{
 const c=connection.useDb('goleve_notification59_'+resource.run+'_payment'),m=model(c,'PublisherPayment');await m.Payment.createIndexes();const actor=ctx(),s=new PaymentService(m,fixtures),p=await s.create(actor,input(),'outbox');await s.confirm(actor,p.id,'confirm');
 const original=amqp.connect,events=[];let fail=true;const channel={on(){},removeListener(){},async assertExchange(){},async assertQueue(){},async bindQueue(){},async close(){},publish(exchange,key,buffer,options,cb){events.push({exchange,key,event:JSON.parse(buffer.toString()),persistent:options.persistent});cb(fail?Error('synthetic broker unavailable'):null);}};
 amqp.connect=async()=>({on(){},async createConfirmChannel(){return channel;},async close(){}});
 const old=process.env.NODE_ENV;process.env.NODE_ENV='test';try{assert.equal(await publishPaymentOutbox(m.Payment,'amqp://simulated.test'),0);let doc=await m.Payment.findById(p.id);assert.equal(doc.notificationOutbox[0].status,'pending');await m.Payment.updateOne({_id:p.id},{$set:{'notificationOutbox.0.nextAttemptAt':new Date(0)}});fail=false;assert.equal(await publishPaymentOutbox(m.Payment,'amqp://simulated.test'),1);doc=await m.Payment.findById(p.id);assert.equal(doc.notificationOutbox[0].status,'published');assert.equal(events.length,2);assert.equal(events[0].event.eventId,events[1].event.eventId);assert(events.every(e=>e.persistent&&e.event.payload.simulated===true));assert.equal(await publishPaymentOutbox(m.Payment,'amqp://simulated.test'),0);}finally{amqp.connect=original;if(old===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=old;}
});
