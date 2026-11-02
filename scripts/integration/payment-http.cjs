'use strict';
// Explicit operator deployment followed by focused HTTP tests; never starts dependencies.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), cp = require('node:child_process');
const assert = require('node:assert/strict'), { randomUUID, randomBytes, createHash } = require('node:crypto');
const tools = require('../integration.cjs'), { inventory, compareBaseline } = require('./e2e.cjs');
const sha = input => createHash('sha256').update(input).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const services = ['mongodb','rabbitmq','auth-service','user-service','training-service','hydration-service','performance-service','professional-service','agenda-service','payment-service','notification-service','management-service','ai-coach-service','api-gateway'];
const resourceNames = () => ({
  volumes: tools.docker('volume','ls','--format','{{.Name}} {{.Driver}}').split('\n').sort(),
  networks: tools.docker('network','ls','--no-trunc','--format','{{.ID}} {{.Name}}').split('\n').sort(),
});
const readCode = `
const fs=require('fs'),crypto=require('crypto'),mongoose=require('mongoose');
const input=JSON.parse(process.argv[1]),uri=new URL(process.env.MONGO_URI);
if(uri.hostname!=='mongodb'||uri.pathname!=='/goleve_notification59_'+input.instance+'_payment'||uri.username!=='integration_payment')throw Error('Foreign database refused');
void(async()=>{
 const c=await mongoose.createConnection(process.env.MONGO_URI,{serverSelectionTimeoutMS:5000}).asPromise();
 try {
  if(input.action==='core'){
   const result={};
   for(const name of ['payments','appointment_payments']){
    const filter=input.ids?{_id:{$in:(input.ids[name]||[]).map(id=>new mongoose.Types.ObjectId(id))}}:{};
    const docs=await c.db.collection(name).find(filter,{projection:{notificationOutbox:0,notificationVersion:0,updatedAt:0}}).sort({_id:1}).toArray();
    result[name]={ids:docs.map(d=>String(d._id)),count:docs.length,hash:crypto.createHash('sha256').update(JSON.stringify(docs)).digest('hex')};
   }
   console.log(JSON.stringify(result));
  } else if(input.action==='processing'){
   console.log(JSON.stringify({activeClaims:await c.db.collection('payments').countDocuments({'bankAttempt.status':'processing','bankAttempt.deadlineAt':{$gt:new Date()}}),staleClaims:await c.db.collection('payments').countDocuments({'bankAttempt.status':'processing','bankAttempt.deadlineAt':{$lte:new Date()}}),integratedProcessing:await c.db.collection('appointment_payments').countDocuments({state:'processing'})}));
  } else if(input.action==='payment'){
   if(!/^[a-f0-9]{24}$/.test(input.id)||!/^[a-f0-9]{24}$/.test(input.owner))throw Error('Own fixture required');
   const p=await c.db.collection('payments').findOne({_id:new mongoose.Types.ObjectId(input.id),ownerId:input.owner});if(!p)throw Error('Fixture missing');
   console.log(JSON.stringify({state:p.state,attemptStatus:p.bankAttempt?.status,providerKey:p.bankAttempt?.providerKey,claims:p.history.filter(h=>h.reason==='bank_claim_acquired').length,approvals:p.history.filter(h=>h.state==='approved').length,unknownHistory:p.history.filter(h=>h.reason==='bank_outcome_unknown').length,events:(p.notificationOutbox||[]).map(e=>({eventId:e.eventId,type:e.type,status:e.status,version:e.version}))}));
  } else throw Error('Unknown read operation');
 } finally {await c.close();}
})().catch(e=>{console.error('Private evidence unavailable: '+(e.code||e.name));process.exitCode=1;});
`;
async function run(deploy) {
  const state = tools.load(); assert.equal(state.project,'goleve-integration-v1-ad8ea9a1719b5a21');
  assert.equal(cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),'feat/backend-e2e-v1');
  const baseline = JSON.parse(fs.readFileSync(path.join(state.directory,'payment-http-baseline.json'),'utf8'));
  assert.equal(baseline.build.status,'passed');
  const output = path.join(state.directory,'payment-http-validation.json');
  assert(!fs.existsSync(output),'Existing validation must be retained; do not repeat automatically');
  const report = { startedAt:new Date().toISOString(), project:state.project, deployment:[], results:[], originalGlobalResultPreserved:true };
  const save = () => fs.writeFileSync(output,JSON.stringify(report,null,2),{mode:0o600});
  const request = async (route, actor, body, headers={}) => {
    const response = await fetch('http://127.0.0.1:'+state.port+route,{method:body===undefined?'GET':'POST',headers:{Connection:'close',Origin:'http://localhost:5173',...(actor?{Authorization:'Bearer '+actor.token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    const text=await response.text(); let data;try{data=text?JSON.parse(text):null;}catch{data=null;}
    return {status:response.status,data:data?.data??data};
  };
  const expect = (response,status) => { assert.equal(response.status,status,'Unexpected HTTP status');return response.data; };
  const register = async () => {const r=expect(await request('/auth/register',null,{name:'Fictional Payment HTTP',email:'payment-http-'+randomUUID()+'@example.invalid',password:'Fictional-'+randomBytes(12).toString('hex')}),201);return {id:r.user.id,token:r.accessToken};};
  const create = async actor => expect(await request('/payments',actor,{priceReference:'integration-approve',amountCents:2500,serviceReference:'fictional-http-payment'},{'Idempotency-Key':randomUUID()}),201);
  const confirm = (actor,id,key) => request('/payments/'+id+'/confirm',actor,{}, {'Idempotency-Key':key});
  const evidence = input => JSON.parse(tools.docker('exec',tools.own(state,'payment-service').id,'node','-e',readCode,JSON.stringify({instance:state.id,...input})));
  const check = async (name,work,method='gateway-http') => {
    const start=Date.now();
    try{const data=await work();report.results.push({name,status:'passed',method,durationMs:Date.now()-start,...(data?{evidence:data}:{})});save();console.log('PASSED '+name);}
    catch(error){report.results.push({name,status:'failed',method,durationMs:Date.now()-start,code:error.code||error.name});save();throw error;}
  };
  const validators = () => {for(const [file,hash] of Object.entries(baseline.validatorHashes))assert.equal(sha(fs.readFileSync(path.join(__dirname,file))),hash);assert.equal(sha(fs.readFileSync(path.resolve(__dirname,'../../backend/services/payment-service/src/services/mock-bank.provider.ts'))),baseline.mockSourceHash);};
  let target = tools.own(state,'payment-service');
  try {
    validators();
    assert.equal(target.id,baseline.target.id);assert.equal(target.health,'healthy');
    compareBaseline(baseline.containers,inventory());assert.deepEqual(resourceNames(),{volumes:baseline.volumes,networks:baseline.networks});
    const memoryCode="const fs=require('fs'),m=fs.readFileSync('/proc/meminfo','utf8');console.log(JSON.stringify({availableKiB:Number(/^MemAvailable:\\s+(\\d+)/m.exec(m)[1]),pressure:fs.readFileSync('/proc/pressure/memory','utf8')}));";
    const vm=JSON.parse(tools.docker('exec',target.id,'node','-e',memoryCode));
    assert(os.freemem()>=1.2*1024**3,'Windows memory insufficient');assert(vm.availableKiB>=1.2*1024**2,'WSL memory insufficient');
    assert(/some avg10=0\.00/.test(vm.pressure)&&/full avg10=0\.00/.test(vm.pressure),'Current WSL memory pressure');
    const processing=evidence({action:'processing'});assert.deepEqual(processing,{activeClaims:0,staleClaims:0,integratedProcessing:0});
    report.preflight={windowsFreeGiB:os.freemem()/1024**3,vm,processing};save();
    const preservedActor=await register(),preservedPayment=await create(preservedActor);
    const core=evidence({action:'core'}),ids=Object.fromEntries(Object.entries(core).map(([name,value])=>[name,value.ids]));
    report.dataBefore=Object.fromEntries(Object.entries(core).map(([name,value])=>[name,{count:value.count,hash:value.hash}]));
    assert(deploy,'Explicit --deploy operator instruction required');
    assert.deepEqual(evidence({action:'processing'}),processing);
    console.log('DRAINING ONLY '+target.name);
    tools.compose(state,['stop','--timeout','45','payment-service']);
    const stopped=JSON.parse(tools.docker('inspect','--format','{"status":{{json .State.Status}},"exitCode":{{json .State.ExitCode}},"oom":{{json .State.OOMKilled}}}',target.id));
    report.deployment.push({operation:'stop',id:target.id,...stopped});save();assert.equal(stopped.status,'exited');assert.equal(stopped.exitCode,0);assert.equal(stopped.oom,false);
    tools.compose(state,['up','-d','--no-deps','--no-build','--force-recreate','payment-service']);
    target=tools.own(state,'payment-service');assert.notEqual(target.id,baseline.target.id);assert.notEqual(target.image,baseline.target.image);
    report.deployment.push({operation:'recreate',id:target.id,image:target.image});save();
    const end=Date.now()+120000;
    while(target.health!=='healthy'&&Date.now()<end){assert.equal(target.state,'running');await sleep(1000);target=tools.own(state,'payment-service');}
    assert.equal(target.health,'healthy');assert.deepEqual(target.mounts,baseline.target.mounts);
    const readyUntil=Date.now()+40000;let gatewayReady;
    do{gatewayReady=await request('/ready');if(gatewayReady.status===200)break;await sleep(1000);}while(Date.now()<readyUntil);
    expect(gatewayReady,200);
    const installed=JSON.parse(tools.docker('exec',target.id,'node','-e',"const fs=require('fs'),crypto=require('crypto'),b=fs.readFileSync('dist/services/payment.service.js');console.log(JSON.stringify({hash:crypto.createHash('sha256').update(b).digest('hex'),claim:b.includes(Buffer.from('bankAttempt')),uncertain:b.includes(Buffer.from('PAYMENT_RECONCILIATION_REQUIRED'))}));"));
    assert.equal(installed.hash,baseline.compiledHash);assert(installed.claim&&installed.uncertain);report.installedCode=installed;
    const dataAfter=evidence({action:'core',ids});for(const [name,value]of Object.entries(core)){assert.equal(dataAfter[name].hash,value.hash);assert.equal(dataAfter[name].count,value.count);}report.dataAfter=Object.fromEntries(Object.entries(dataAfter).map(([name,value])=>[name,{count:value.count,hash:value.hash}]));
    const preserved=expect(await request('/payments/'+preservedPayment.id,preservedActor),200);assert.deepEqual(preserved,preservedPayment);
    expect(await request('/auth/me',preservedActor),200);
    await check('Installed Docker code, health, Gateway readiness and preexisting data/session preserved',async()=>{const r=expect(await request('/ready'),200);assert(r.dependencies.some(d=>d.service==='payment'&&d.status==='ready'));return {paymentHealthy:true,gatewayReady:true,dataFingerprintMatches:true};},'docker-and-gateway-http');
    const actor=await register();let normal,normalKey,normalReceipt,same,uncertain;
    await check('Concurrent HTTP confirmations with distinct keys yield one approval',async()=>{
      normal=await create(actor);const keys=[randomUUID(),randomUUID()];const results=await Promise.all(keys.map(key=>confirm(actor,normal.id,key)));
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const winner=results.findIndex(r=>r.status===200);normalKey=keys[winner];normalReceipt=results[winner].data;
      assert.equal(normalReceipt.state,'approved');const p=evidence({action:'payment',id:normal.id,owner:actor.id});assert.equal(p.claims,1);assert.equal(p.approvals,1);assert.equal(p.attemptStatus,'settled');assert.equal(p.events.filter(e=>e.type==='payment.simulated.approved.v1').length,1);
      return {statuses:results.map(r=>r.status),claims:p.claims,approvedTransitions:p.approvals};
    });
    await check('Winning HTTP idempotency key replays the same persisted receipt',async()=>{
      const replay=expect(await confirm(actor,normal.id,normalKey),200);assert.equal(replay.transactionReference,normalReceipt.transactionReference);
      expect(await confirm(actor,normal.id,randomUUID()),409);assert.equal(evidence({action:'payment',id:normal.id,owner:actor.id}).approvals,1);
    });
    await check('Concurrent HTTP confirmations with the same key preserve one result',async()=>{
      same=await create(actor);const key=randomUUID(),rs=await Promise.all([confirm(actor,same.id,key),confirm(actor,same.id,key)]);
      assert(rs.some(r=>r.status===200));assert(rs.every(r=>[200,409].includes(r.status)));assert.equal(expect(await confirm(actor,same.id,key),200).state,'approved');
      const p=evidence({action:'payment',id:same.id,owner:actor.id});assert.equal(p.claims,1);assert.equal(p.approvals,1);return {statuses:rs.map(r=>r.status),claims:p.claims,approvedTransitions:p.approvals};
    });
    await check('Original unmodified E2E probe uses installed modules and calls the bank once',async()=>{
      uncertain=await create(actor);validators();const result=JSON.parse(tools.exec(state,'payment-service','e2e-probe.cjs',{instance:state.id,action:'payment-concurrency',owner:actor.id,id:uncertain.id}));
      assert.equal(result.bankCalls,1);assert.equal(result.approvedTransitions,0);assert.equal(result.resultingState,'pending');report.originalProbe=result;return result;
    },'original-component-probe-in-built-image-no-preload');
    await check('Timed-out probe result is explicitly uncertain through real HTTP',async()=>{
      const p=expect(await request('/payments/'+uncertain.id,actor),200);assert.equal(p.state,'pending');assert.equal(p.confirmationStatus,'reconciliation_required');assert.equal(p.reconciliationRequired,true);assert.equal(p.transactionReference,undefined);
      const stored=evidence({action:'payment',id:uncertain.id,owner:actor.id});assert.equal(stored.claims,1);assert.equal(stored.approvals,0);assert.equal(stored.unknownHistory,1);assert.equal(stored.attemptStatus,'unknown');return {state:p.state,confirmationStatus:p.confirmationStatus};
    });
    await check('HTTP replay and fresh keys cannot repeat an uncertain charge',async()=>{
      for(const key of ['e2e-confirm-one','e2e-confirm-two',randomUUID()]){const r=await confirm(actor,uncertain.id,key);assert.equal(r.status,503);assert.equal(r.data.error.code,'PAYMENT_RECONCILIATION_REQUIRED');}
      const cancelled=await request('/payments/'+uncertain.id+'/cancel',actor,{}, {'Idempotency-Key':randomUUID()});assert.equal(cancelled.status,503);assert.equal(cancelled.data.error.code,'PAYMENT_RECONCILIATION_REQUIRED');
      const p=evidence({action:'payment',id:uncertain.id,owner:actor.id});assert.equal(p.claims,1);assert.equal(p.approvals,0);assert.equal(p.events.length,1);
    });
    await check('Another HTTP identity cannot inspect or confirm these payments',async()=>{
      const outsider=await register();expect(await request('/payments/'+normal.id,outsider),404);expect(await confirm(outsider,normal.id,randomUUID()),404);expect(await request('/payments/'+uncertain.id,outsider),404);
    });
    await check('Real publisher and Notification deliver one event per HTTP/probe result',async()=>{
      const expected=[{id:normal.id,type:'payment.simulated.approved.v1'},{id:same.id,type:'payment.simulated.approved.v1'},{id:uncertain.id,type:'payment.simulated.unknown.v1'}];
      const until=Date.now()+40000;let items=[];
      do{items=expect(await request('/notifications?pageSize=100',actor),200).items;if(expected.every(x=>items.some(n=>n.reference?.paymentId===x.id&&n.eventType===x.type)))break;await sleep(1000);}while(Date.now()<until);
      for(const x of expected){const found=items.filter(n=>n.reference?.paymentId===x.id&&n.eventType===x.type);assert.equal(found.length,1);assert.equal(found[0].category,'payment');const p=evidence({action:'payment',id:x.id,owner:actor.id});assert.equal(p.events.length,1);assert.equal(p.events[0].status,'published');}
      return {approvedNotifications:2,unknownNotifications:1,duplicates:0};
    });
    await check('All preexisting payment records and the original validators remain preserved',async()=>{
      const final=evidence({action:'core',ids});for(const [name,value]of Object.entries(core)){assert.equal(final[name].hash,value.hash);assert.equal(final[name].count,value.count);}validators();return {dataHashesMatch:true,validatorsUnchanged:true,mockProviderUnchanged:true};
    },'private-read-only-evidence');
  } catch(error) {report.failure={code:error.code||error.name,message:error.message};throw error;}
  finally {
    try {
      const after=inventory(),allowedOld=baseline.target.id;
      report.preservation=compareBaseline(baseline.containers.filter(c=>c.id!==allowedOld),after);
      for(const previous of baseline.containers.filter(c=>c.id!==allowedOld))assert.equal(after.find(c=>c.id===previous.id)?.state,previous.state);
      assert.equal(after.length,baseline.containers.length);assert.deepEqual(resourceNames(),{volumes:baseline.volumes,networks:baseline.networks});
      report.parallelHealthy=services.filter(n=>tools.own(state,n).health==='healthy').length;assert.equal(report.parallelHealthy,14);
      report.gatewayChecks=[];for(const port of [3000,64344])for(const route of ['/health','/ready']){const r=await fetch('http://127.0.0.1:'+port+route,{headers:{Connection:'close'},signal:AbortSignal.timeout(5000)});report.gatewayChecks.push({port,route,status:r.status});await r.body?.cancel();}
      validators();report.finalProcessing=evidence({action:'processing'});
    } catch(error) {report.preservationFailure={code:error.code||error.name,message:error.message};process.exitCode=1;}
    report.finishedAt=new Date().toISOString();report.counts={passed:report.results.filter(r=>r.status==='passed').length,failed:report.results.filter(r=>r.status==='failed').length};save();
    console.log('PAYMENT HTTP SUMMARY '+JSON.stringify(report));
  }
}
if(require.main===module){assert.deepEqual(process.argv.slice(2),['--deploy'],'Explicit --deploy required');void run(true).catch(error=>{console.error('Payment HTTP validation interrupted: '+(error.code||error.name));process.exitCode=1;});}
