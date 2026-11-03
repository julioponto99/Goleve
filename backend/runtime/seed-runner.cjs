'use strict';
// Runs INSIDE one service. Imports only that owner's models and connects only to its DB.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const demo=require('./local-demo.cjs'),{fixtures}=require('./fixtures.cjs');
const own=name=>require(path.join(process.cwd(),'dist',name));
async function run(){
 const p=demo.policy(),owner=process.env.LOCAL_DEMO_OWNER;
 if(!p||process.env.LOCAL_DEMO_SEED_ACK!=='explicit-fictional-preparation'||!['auth','user','training','hydration','performance','agenda','professional','management','notification','payment'].includes(owner))throw Error('Explicit owner fixture preparation required');
 const uri=new URL(process.env.MONGO_URI||''),suffix={user:'user',payment:'payment',notification:'notification'}[owner]||owner;
 if(uri.hostname!=='mongodb'||uri.pathname!=='/goleve_'+suffix||uri.searchParams.get('replicaSet')!=='goleveV1')throw Error('Owner database mismatch');
 const mongoose=createRequire(path.join(process.cwd(),'package.json'))('mongoose');
 let c,models;
 if(owner==='auth'){await mongoose.connect(uri.href);c=mongoose.connection;models={AuthUser:own('models/auth-user.model').AuthUser,...own('administration/models').securityModels()};}
 else{c=await mongoose.createConnection(uri.href,{serverSelectionTimeoutMS:5000}).asPromise();const module=own('models');const factory=owner==='agenda'?'createAgendaModels':owner==='management'?'createManagementModels':'create'+owner[0].toUpperCase()+owner.slice(1)+'Models';models=module[factory](c);}
 try{
  if(!(await c.db.admin().command({hello:1})).setName)throw Error('Transactions required');
  if(owner==='professional')models.Entitlement=own('local-demo-fixtures').entitlementModel(c);
  if(owner==='management'){
   models.DemoGrant=own('local-demo-grants').demoGrantModel(c);
   const r=await fetch(process.env.PROFESSIONAL_SERVICE_URL+'/professionals/services',{redirect:'error',signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Canonical service validation unavailable');const b=await r.json();for(const id of [p.resources.ptService,p.resources.nutritionService])if(!b.data?.items?.some(s=>s.id===id&&s.authority==='synthetic'))throw Error('Fixture scope service does not exist in Professional catalogue');
  }
  await Promise.all(Object.values(models).map(m=>m.init()));
  const Journal=c.models.LocalDemoSeedJournal||c.model('LocalDemoSeedJournal',new mongoose.Schema({_id:String,instance:String,owner:String,model:String,resourceId:String,source:String,createdAt:Date},{strict:'throw',versionKey:false,collection:'local_demo_seed_journal'}));await Journal.init();
  let rows=fixtures(owner,p);
  if(owner==='auth'){
   const v=JSON.parse(fs.readFileSync(process.env.LOCAL_DEMO_CREDENTIALS_FILE)),key=Buffer.from(fs.readFileSync(process.env.LOCAL_DEMO_CREDENTIALS_KEY_FILE,'utf8').trim(),'hex'),d=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(v.iv,'hex'));d.setAAD(Buffer.from('goleve-local-demo-credentials-v1:'+p.instance));d.setAuthTag(Buffer.from(v.tag,'hex'));const credentials=JSON.parse(Buffer.concat([d.update(Buffer.from(v.data,'base64')),d.final()]));
   const bcrypt=require('bcrypt');for(const a of p.accounts){const credential=credentials.find(x=>x.email===a.email);if(!credential)throw Error('Credential unavailable');const old=await models.AuthUser.findOne({email:a.email}).select('+passwordHash +localDemoInstanceId');if(old&&(String(old._id)!==a.id||old.localDemoInstanceId!==p.instance||old.userType!==a.role||!await bcrypt.compare(credential.password,old.passwordHash)))throw Error('Existing account cannot be adopted or overwritten');rows.push({model:'AuthUser',key:a.email,doc:{_id:a.id,email:a.email,name:a.name,userType:a.role,localDemoInstanceId:p.instance,passwordHash:await bcrypt.hash(credential.password,12),accountStatus:'active',mfaEnabled:false}});}
  }
  let created=0,existing=0;const session=await c.startSession();
  try{await session.withTransaction(async()=>{created=0;existing=0;for(const row of rows){const Model=models[row.model];if(!Model)throw Error('Unknown owner model');const id=p.instance+':'+owner+':'+row.key,journal=await Journal.findById(id).session(session);if(journal){if(journal.resourceId!==String(row.doc._id)||journal.model!==row.model||!await Model.exists({_id:row.doc._id}).session(session))throw Error('Existing fixture provenance differs');existing++;continue;}if(await Model.exists({_id:row.doc._id}).session(session))throw Error('Unowned existing resource cannot be overwritten');await Model.create([row.doc],{session});await Journal.create([{_id:id,instance:p.instance,owner,model:row.model,resourceId:String(row.doc._id),source:'explicit_local_demo_cli',createdAt:new Date()}],{session});if(owner==='auth')await models.Audit.create([{actorId:'local-demo-installation',action:'local_demo.identity.created',resourceId:String(row.doc._id),occurredAt:new Date(),result:'allowed',reasonCode:'explicit_fictional_preparation',correlationId:crypto.randomUUID()}],{session});created++;}},{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});}finally{await session.endSession();}
  console.log(JSON.stringify({owner,created,existing,source:'explicit_local_demo_cli',destructiveOperations:0}));
 }finally{await c.close();}
}
if(require.main===module)run().catch(()=>{console.error('Owner seed refused; existing data preserved. Inspect models, scope and fixture provenance.');process.exitCode=1;});
