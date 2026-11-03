'use strict';
// Real HTTP against the official loopback Gateway. No tokens/passwords are persisted.
const fs=require('node:fs'),crypto=require('node:crypto'),{decryptCredentials}=require('./local-demo.cjs');
const p=JSON.parse(fs.readFileSync('.secrets/local-runtime/demo-identities.json')),credentials=decryptCredentials(),tokens=[],results=[];
const stateFile='.local/demo-http-state.json',state=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile)): {instance:p.instance,payments:{},appointments:{}};
if(state.instance!==p.instance)throw Error('Existing HTTP fixture state belongs to another instance');
const ensure=(condition,message)=>{if(!condition)throw Error(message);};
const save=()=>fs.writeFileSync(stateFile,JSON.stringify(state,null,2),{mode:0o600});
const key=name=>'local-demo-'+p.instance+'-'+name;
const etag=d=>'"'+d.id+':'+d.version+'"';
async function call(path,index,method='GET',body,headers={},allowed=[200,201,204]) {
 if(!/^\/(auth|users|training|hydration|performance|agenda|professionals|care-relationships|management|payments|notifications|ai-coach|health|ready|internal)(\/|\?|$)/.test(path))throw Error('Closed API boundary');
 const r=await fetch('http://127.0.0.1:3000'+path,{method,headers:{...(tokens[index]?{Authorization:'Bearer '+tokens[index]}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(12000)});
 const text=await r.text();let data;try{data=text?JSON.parse(text):undefined;}catch{throw Error('Unexpected non-JSON API response');}
 if(!allowed.includes(r.status))throw Error(method+' '+path.split('?')[0]+' returned '+r.status+' '+(data?.error?.code||''));
 return{status:r.status,body:data,data:data?.data,headers:r.headers};
}
async function check(name,work){try{await work();results.push({name,status:'passed'});console.log('PASS '+name);}catch(e){results.push({name,status:'failed',error:e.message});throw e;}}
async function run(){
 await check('Gateway health and readiness',async()=>{await call('/health');await call('/ready');});
 for(let i=0;i<5;i++)await check('Login without MFA / '+p.accounts[i].role+' '+i,async()=>{
  const a=p.accounts[i],c=credentials.find(c=>c.email===a.email),r=await call('/auth/login',undefined,'POST',{email:a.email,password:c.password});ensure(r.body.authority==='local-demo'&&!r.body.mfaRequired&&r.body.user.id===a.id,'Login authority mismatch');tokens[i]=r.body.accessToken;
  const claims=JSON.parse(Buffer.from(tokens[i].split('.')[1],'base64url'));ensure(claims.authority==='local-demo'&&claims.di===p.instance&&!claims.mfa,'JWT falsely claims MFA');
  const me=await call('/auth/me',i);ensure(me.body.authority==='local-demo'&&me.body.user.userType===a.role,'Current role mismatch');const s=await call('/auth/sessions',i);ensure(s.data.items.some(s=>s.current&&s.mfa===false),'Session must not claim MFA');
 });
 for(const path of ['/users/me','/users/me/preferences','/training/plans','/training/sessions','/hydration/goal','/performance/measurements','/agenda/activities'])await check('User data '+path,async()=>{await call(path,0);});
 await check('Hydration daily and actual goal',async()=>{const day=new Date(p.seedEpoch).toISOString().slice(0,10),r=await call('/hydration/intakes/daily?date='+day+'&timezone=Europe%2FLisbon',0);ensure(r.data.targetMl===2000,'Seed goal mismatch');});
 for(const i of [1,2])for(const path of ['/professionals/me','/professionals/me/capabilities','/professionals/me/services','/professionals/me/application-status'])await check('Professional '+i+' '+path,async()=>{const r=await call(path,i);if(path.endsWith('application-status'))ensure(!r.data?.publicationEnabled,'Fixture must not pretend real publication approval');});
 await check('Synthetic professional catalogue',async()=>{const r=await call('/professionals/services',0);ensure([p.resources.ptService,p.resources.nutritionService].every(id=>r.data.items.some(s=>s.id===id&&s.authority==='synthetic')),'Canonical fixture services missing');});
 for(const path of ['/management/me','/management/scopes','/management/services','/management/professionals','/management/appointments','/management/payments','/management/cases'])await check('Scoped manager '+path,async()=>{await call(path,3);});
 await check('Manager UTC dashboard / privacy',async()=>{const from=new Date(p.seedEpoch).toISOString().slice(0,10),to=new Date(Date.parse(from)+86400000).toISOString().slice(0,10),r=await call('/management/dashboard?from='+from+'&to='+to,3);ensure(r.data.sources.every(s=>s.status==='available'),'Operational dependency unavailable');for(const s of r.data.sources)for(const row of s.series)ensure(row.value===null&&(!row.suppressed||row.range===null),'Protected count exposed');});
 await check('Demo administrator sees only five authorized accounts',async()=>{const r=await call('/auth/administration/users',4);ensure(r.data.items.length===5&&r.data.items.every(u=>p.accounts.some(a=>a.id===u.id)),'Real accounts exposed to demo admin');});
 for(const path of ['/management/operators','/management/assignments','/management/administration/professionals'])await check('Administrator '+path,async()=>{await call(path,4);});
 await check('No administrative access for manager/user',async()=>{await call('/auth/administration/users',3,'GET',undefined,{},[403]);await call('/auth/administration/users',0,'GET',undefined,{},[403]);});
 await check('User and professionals cannot consult management grants',async()=>{for(const i of [0,1,2])await call('/management/assignments',i,'GET',undefined,{},[403]);});
 await check('Anonymous and invalid JWT blocked',async()=>{await call('/users/me',undefined,'GET',undefined,{},[401]);await call('/users/me',undefined,'GET',undefined,{Authorization:'Bearer invalid.token.value'},[401]);});
 await check('Public privileged registration rejected',async()=>{await call('/auth/register',undefined,'POST',{name:'Fictitious invalid request',email:'never-created@example.invalid',password:'NotARealCredential-123!',userType:'administrador'},{},[400]);});
 await check('Internal technical endpoints hidden by Gateway',async()=>{await call('/internal/v1/local-demo/identity',undefined,'POST',{}, {},[404]);await call('/auth/internal/v1/management/admin-check',4,'POST',{}, {},[404]);});
 await check('Web CORS and unapproved origin rejection',async()=>{const r=await call('/auth/me',0,'GET',undefined,{Origin:'http://127.0.0.1:5173'});ensure(r.headers.get('access-control-allow-origin')==='http://127.0.0.1:5173','Web origin not authorized');await call('/auth/me',0,'GET',undefined,{Origin:'https://not-authorized.example.invalid' },[403]);});
 await check('AI provider unavailable explicitly',async()=>{await call('/ai-coach/conversations',0,'GET',undefined,{},[503]);});
 for(const [name,reference,finish]of [['approved','local-demo-pt','confirm'],['declined','local-demo-decline','confirm'],['cancelled','local-demo-pt','cancel'],['pending','local-demo-pt',null]])await check('Mock payment '+name+' with idempotency',async()=>{
  const created=await call('/payments',0,'POST',{priceReference:reference,amountCents:3500,serviceReference:'local-demo-'+p.instance},{'Idempotency-Key':key('payment-'+name)});state.payments[name]=created.data.id;save();
  const r=finish?await call('/payments/'+created.data.id+'/'+finish,0,'POST',{}, {'Idempotency-Key':key('payment-'+name+'-'+finish)}):created;ensure(r.data.state===name,'Unexpected mock payment outcome');
  const again=await call('/payments',0,'POST',{priceReference:reference,amountCents:3500,serviceReference:'local-demo-'+p.instance},{'Idempotency-Key':key('payment-'+name)});ensure(again.data.id===created.data.id,'Payment duplicated');
 });
 await check('Manager suspension/reactivation preserves eligibility checks',async()=>{
  let r=await call('/management/services',3),s=r.data.items.find(s=>s.id===p.resources.ptService);ensure(s,'Fixture service missing');
  if(s.active){r=await call('/management/services/'+s.id+'/suspend',3,'POST',{reasonCode:'demo_operational_check'},{'If-Match':etag(s)});s=r.data;}
  ensure(s.managementSuspended,'Service was not management-suspended');r=await call('/management/services/'+s.id+'/reactivate',3,'POST',{reasonCode:'demo_operational_check'},{'If-Match':etag(s)});ensure(r.data.active,'Local fixture reactivation failed');
 });
 for(const [index,prefix]of [[1,'pt'],[2,'nutrition']])await check('Professional availability and accepted appointment '+prefix,async()=>{
  const rsrc=p.resources,capabilityId=rsrc[prefix+'Capability'],professionalId=rsrc[prefix+'Profile'],serviceId=rsrc[prefix+'Service'];
  const fromDay=p.seedEpoch.slice(0,10),until=p.expiresAt.slice(0,10);
  for(let weekday=0;weekday<7;weekday++)await call('/agenda/professional/availability-rules',index,'POST',{capabilityId,weekday,localStartTime:'09:00',localEndTime:'18:00',validFrom:fromDay,validUntil:until,timezone:'Europe/Lisbon',sessionModes:['online'],environments:[],slotDurationMinutes:60,bufferBeforeMinutes:15,bufferAfterMinutes:15},{'Idempotency-Key':key(prefix+'-availability-'+weekday)});
  let appointment;
  if(state.appointments[prefix])appointment=(await call('/agenda/professional-appointments/'+state.appointments[prefix],0)).data;
  else{
   const from=new Date(Date.parse(fromDay)+3*86400000).toISOString(),to=new Date(Date.parse(fromDay)+6*86400000).toISOString();
   const available=await call('/agenda/professionals/'+professionalId+'/availability?'+new URLSearchParams({capabilityId,from,to,mode:'online'}),0);ensure(available.data.items.length,'No synthetic availability');const slot=available.data.items[0],startAtUtc=new Date(slot.startAtUtc).toISOString(),endAtUtc=new Date(Date.parse(startAtUtc)+3600000).toISOString();
   const body={serviceId,professionalId,capabilityId,appointmentType:'one_off_session',mode:'online',startAtUtc,endAtUtc,timezone:'Europe/Lisbon'};
   const both=await Promise.all([call('/agenda/professional-appointments',0,'POST',body,{'Idempotency-Key':key(prefix+'-booking-a')},[200,201,409]),call('/agenda/professional-appointments',0,'POST',body,{'Idempotency-Key':key(prefix+'-booking-b')},[200,201,409])]);ensure(both.filter(r=>r.status!==409).length===1,'Concurrent interval exclusion failed');appointment=both.find(r=>r.status!==409).data;state.appointments[prefix]=appointment.id;save();
   await call('/payments/appointments/'+appointment.id,0,'POST',{}, {'Idempotency-Key':key(prefix+'-premature-payment')},[409]);
  }
  if(appointment.status==='requested')appointment=(await call('/agenda/professional/appointments/'+appointment.id+'/accept',index,'POST',{}, {'If-Match':etag(appointment),'Idempotency-Key':key(prefix+'-accept')})).data;
  ensure(appointment.status==='accepted','Appointment not accepted');
  await call('/payments/appointments/'+appointment.id,index,'POST',{}, {'Idempotency-Key':key(prefix+'-other-user-payment')},[403,404]);
  await call('/payments/appointments/'+appointment.id,0,'POST',{priceCents:1}, {'Idempotency-Key':key(prefix+'-altered-price')},[400]);
  const payment=(await call('/payments/appointments/'+appointment.id,0,'POST',{}, {'Idempotency-Key':key(prefix+'-integrated-payment')})).data;state.payments[prefix+'Integrated']=payment.id;save();ensure(payment.quote.priceCents===(prefix==='pt'?3500:5000)&&payment.quote.authority==='synthetic','Untrusted quotation');
  const confirmations=await Promise.all([call('/payments/appointment-payments/'+payment.id+'/confirm',0,'POST',{}, {'Idempotency-Key':key(prefix+'-confirm')},[200,409]),call('/payments/appointment-payments/'+payment.id+'/confirm',0,'POST',{}, {'Idempotency-Key':key(prefix+'-confirm')},[200,409])]);ensure(confirmations.some(r=>r.data?.state==='approved')&&!confirmations.some(r=>r.data?.state==='unknown'),'Integrated confirmation failed');
  await call('/agenda/professional-appointments/'+appointment.id+'/history',0);
 });
 await check('Payment event reaches Notification through RabbitMQ',async()=>{
  let found=false;for(let i=0;i<20&&!found;i++){const r=await call('/notifications?limit=100',0);found=r.data.items.some(n=>n.category==='payment'&&n.reference?.paymentId===state.payments.ptIntegrated);if(!found)await new Promise(resolve=>setTimeout(resolve,1000));}ensure(found,'Payment notification not persisted');
 });
 await check('Password-only step-up, action binding, single use and session revocation',async()=>{
  const target=(await call('/auth/administration/users/'+p.accounts[0].id,4)).data,parameters={reasonCode:'demo_validation',version:target.version};
  const proof=await call('/auth/admin/step-up',4,'POST',{password:credentials[4].password,action:'user.revoke',targetId:target.id,parameters});const authorization={'X-Admin-Step-Up':proof.data.stepUpToken};
  await call('/auth/administration/users/'+p.accounts[1].id+'/revoke',4,'POST',parameters,authorization,[403]);
  const out=await Promise.all([call('/auth/administration/users/'+target.id+'/revoke',4,'POST',parameters,authorization,[200,403,412]),call('/auth/administration/users/'+target.id+'/revoke',4,'POST',parameters,authorization,[200,403,412])]);ensure(out.filter(r=>r.status===200).length===1,'Step-up consumed concurrently more than once');
  await call('/auth/me',0,'GET',undefined,{},[401]);await call('/auth/admin/step-up',4,'POST',{password:credentials[4].password,action:'role.approve',targetId:p.accounts[1].id,parameters:{}},{},[403]);
 });
 for(let i=1;i<5;i++)await check('Logout revokes session '+i,async()=>{await call('/auth/logout',i,'POST',{});await call('/auth/me',i,'GET',undefined,{},[401]);});
}
run().catch(e=>{console.error('HTTP validation stopped: '+e.message);process.exitCode=1;}).finally(()=>{const report={recordedAt:new Date().toISOString(),mode:'real-http-local-demo',passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results};fs.writeFileSync('.local/demo-http-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failed:report.failed,report:'.local/demo-http-results.json'}));});
