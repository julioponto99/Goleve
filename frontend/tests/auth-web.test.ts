import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, credentialErrors, decodeEnrollment, decodeRecoveryCodes, memorySessionStorage } from '../shared/src/index';
import type { Role } from '../shared/src/index';
import { authAdminIntent, authorizeAuthMutation, decodeSessions } from '../web/src/auth/security';
const origin='https://unit.example.invalid',id='a'.repeat(24),target='b'.repeat(24);
const user=(role:Role='utilizador')=>({id,name:'Conta fictícia',email:'unit@example.invalid',userType:role,accountStatus:'active',roleVersion:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const sessionBody=(role:Role='utilizador')=>({user:user(role),accessToken:'synthetic-session',tokenType:'Bearer',expiresIn:3600});
const credentials={email:user().email,password:'only-a-fictional-password'};
const codes=Array.from({length:10},(_,n)=>n.toString(16).padStart(32,'0'));
test('credential UX follows Auth validation, including UTF-8 password size, controls and matching confirmation',()=>{
 assert.deepEqual(credentialErrors({...credentials,name:'Conta de teste',confirmation:credentials.password}),{});
 assert.equal(Object.keys(credentialErrors({email:'x',password:'á'.repeat(37),name:'\n',confirmation:'different'})).length,4);
 assert.ok(credentialErrors({...credentials,email:'a\0@b.invalid'}).email);
});
test('registration projects only public fields and confirms the current identity before granting a session',async()=>{
 const storage=memorySessionStorage(),bodies:unknown[]=[];
 const runtime=createRuntime({origin,fetch:async(url,init)=>{
  if(String(url).endsWith('/auth/register')){bodies.push(JSON.parse(String(init?.body)));assert(!new Headers(init?.headers).has('Authorization'));return json(sessionBody(),201);}
  return json({user:user()});
 }},storage);
 try{await runtime.session.register({...credentials,name:'Conta de teste',email:' UNIT@EXAMPLE.INVALID ',...{userType:'administrador',confirmation:'ignored'}});assert.deepEqual(bodies,[{name:'Conta de teste',...credentials}]);assert.equal(runtime.session.getSnapshot().status,'authenticated');}
 finally{runtime.session.dispose();}
});
test('an administrative identity returned without the MFA flow is refused',async()=>{
 const runtime=createRuntime({origin,fetch:async url=>json(String(url).endsWith('/auth/me')?{user:user('administrador')}:sessionBody('administrador'))},memorySessionStorage());
 try{await assert.rejects(()=>runtime.session.signIn(credentials),{code:'MFA_REQUIRED'});assert.equal(runtime.session.currentToken(),undefined);assert.equal(runtime.session.getSnapshot().status,'anonymous');}finally{runtime.session.dispose();}
});
test('MFA enrollment and one-time recovery codes are returned only to the caller and never persisted',async()=>{
 const storage=memorySessionStorage(),secret='A'.repeat(32),seen:unknown[]=[];
 const runtime=createRuntime({origin,fetch:async(url,init)=>{
  const path=new URL(String(url)).pathname;
  if(path==='/auth/login')return json({challenge:'c'.repeat(64),mfaRequired:true,enrollmentRequired:true,expiresIn:600});
  if(path==='/auth/mfa/enroll'){seen.push(JSON.parse(String(init?.body)));assert(!new Headers(init?.headers).has('Authorization'));return json({data:{secret,otpauthUri:'otpauth://totp/GoLeve?secret='+secret+'&issuer=GoLeve'}});}
  if(path==='/auth/mfa/complete')return json({...sessionBody('administrador'),recoveryCodes:codes});
  return json({user:user('administrador')});
 }},storage);
 try{
  await assert.rejects(()=>runtime.session.enrollMfa(credentials.password),{code:'MFA_CHALLENGE_EXPIRED'});
  await runtime.session.signIn(credentials);assert.equal(runtime.session.currentToken(),undefined);
  assert.equal((await runtime.session.enrollMfa(credentials.password)).secret,secret);
  assert.deepEqual(seen,[{challenge:'c'.repeat(64),password:credentials.password}]);
  assert.deepEqual(await runtime.session.completeMfa({otp:'123456'}),codes);
  assert.deepEqual(Object.keys((await storage.read())!).sort(),['expiresAt','token']);
  assert(!JSON.stringify(runtime.session.getSnapshot()).includes(secret));assert(!JSON.stringify(runtime.session.getSnapshot()).includes(codes[0]!));
  await assert.rejects(()=>runtime.session.completeMfa({otp:'123456'}),{code:'MFA_CHALLENGE_EXPIRED'});
 }finally{runtime.session.dispose();}
});
test('an expired MFA challenge cannot leave a credential or accept a late identity response',async context=>{
 context.mock.timers.enable({apis:['setTimeout']});
 let finish!:(value:Response)=>void;const runtime=createRuntime({origin,fetch:async url=>{
  if(String(url).endsWith('/auth/login'))return json({challenge:'c'.repeat(64),mfaRequired:true,enrollmentRequired:false,expiresIn:1});
  if(String(url).endsWith('/auth/mfa/complete'))return json(sessionBody('administrador'));
  return new Promise<Response>(resolve=>{finish=resolve;});
 }},memorySessionStorage());
 try{
  await runtime.session.signIn(credentials);const completion=runtime.session.completeMfa({otp:'123456'});
  while(!finish)await new Promise(resolve=>setImmediate(resolve));context.mock.timers.tick(1001);finish(json({user:user('administrador')}));await completion;
  assert.equal(runtime.session.getSnapshot().status,'anonymous');assert.equal(runtime.session.currentToken(),undefined);
 }finally{runtime.session.dispose();context.mock.timers.reset();}
});
test('sensitive response decoders reject invalid recovery/enrollment structures and project session DTOs',()=>{
 assert.throws(()=>decodeRecoveryCodes({recoveryCodes:Array(10).fill('a'.repeat(32))}));
 assert.throws(()=>decodeEnrollment({data:{secret:'A'.repeat(32),otpauthUri:'https://external.invalid'}}));
 const row={id:'1'.repeat(64),current:true,mfa:false,createdAt:'2026-01-01T00:00:00Z',expiresAt:'2026-01-02T00:00:00Z',token:'must-be-projected-out'};
 assert(!JSON.stringify(decodeSessions({data:{items:[row]}})).includes('must-be-projected-out'));
 assert.throws(()=>decodeSessions({data:{items:[{...row,mfa:'yes'}]}}));
});
async function adminRuntime(extra:(path:string,init:RequestInit|undefined)=>Promise<Response>|Response){
 const runtime=createRuntime({origin,fetch:async(url,init)=>{
  const path=new URL(String(url)).pathname;
  if(path==='/auth/login')return json({challenge:'c'.repeat(64),mfaRequired:true,enrollmentRequired:false,expiresIn:600});
  if(path==='/auth/mfa/complete')return json(sessionBody('administrador'));
  if(path==='/auth/me')return json({user:user('administrador')});
  return extra(path,init);
 }},memorySessionStorage());
 await runtime.session.signIn(credentials);await runtime.session.completeMfa({otp:'123456'});return runtime;
}
const intent=()=>authAdminIntent('user.revoke',target,{version:3,reasonCode:'security_review'});
const factor={password:credentials.password,otp:'123456'};
test('step-up binds action, resource, version and reason and executes once under concurrent confirmations',async()=>{
 const requests:{path:string;body:unknown;proof:string|null}[]=[];
 const runtime=await adminRuntime((path,init)=>{
  requests.push({path,body:JSON.parse(String(init?.body)),proof:new Headers(init?.headers).get('X-Admin-Step-Up')});
  return json(path==='/auth/admin/step-up'?{data:{stepUpToken:'d'.repeat(64),expiresIn:300}}:{data:{id:target}});
 });
 try{
  const permit=await authorizeAuthMutation(runtime,intent(),factor),results=await Promise.allSettled([permit.run(),permit.run()]);
  assert.equal(results.filter(row=>row.status==='fulfilled').length,1);assert.equal(requests.length,2);
  assert.deepEqual(requests[0]!.body,{...factor,action:'user.revoke',targetId:target,parameters:{version:3,reasonCode:'security_review'}});
  assert.equal(requests[1]!.path,'/auth/administration/users/'+target+'/revoke');assert.equal(requests[1]!.proof,'d'.repeat(64));
  assert.deepEqual(requests[1]!.body,{version:3,reasonCode:'security_review'});
  assert(!JSON.stringify(permit).includes('d'.repeat(64)));
 }finally{runtime.session.dispose();}
});
test('step-up permits cannot survive logout or local expiry',async()=>{
 let mutations=0;const runtime=await adminRuntime(path=>{
  if(path==='/auth/admin/step-up')return json({data:{stepUpToken:'d'.repeat(64),expiresIn:1}});
  if(path==='/auth/logout')return new Response(null,{status:204});mutations++;return json({});
 });
 try{
  const first=await authorizeAuthMutation(runtime,intent(),factor),realNow=Date.now;
  try{Date.now=()=>realNow()+2000;await assert.rejects(()=>first.run(),{code:'STEP_UP_INVALID'});}finally{Date.now=realNow;}
  const second=await authorizeAuthMutation(runtime,intent(),factor);await runtime.session.signOut();await assert.rejects(()=>second.run(),{code:'STEP_UP_INVALID'});assert.equal(mutations,0);
 }finally{runtime.session.dispose();}
});
test('uncertain administrative writes are not retried or replayed with the same authorization',async()=>{
 let mutations=0;const runtime=await adminRuntime(path=>path==='/auth/admin/step-up'?json({data:{stepUpToken:'d'.repeat(64),expiresIn:300}}):(mutations++,Promise.reject(new TypeError('synthetic lost response'))));
 try{const permit=await authorizeAuthMutation(runtime,intent(),factor);await assert.rejects(()=>permit.run(),{outcome:'unknown'});await assert.rejects(()=>permit.run(),{code:'STEP_UP_CONSUMED'});assert.equal(mutations,1);}finally{runtime.session.dispose();}
});
test('invalid actions/parameters and non-Administrator sessions cannot obtain a proof',async()=>{
 assert.throws(()=>authAdminIntent('manager.invite' as 'user.revoke',target,{version:1,reasonCode:'review'}));
 assert.throws(()=>authAdminIntent('user.revoke',target,{version:1,reasonCode:'review',newRole:'administrador'}));
 assert.throws(()=>authAdminIntent('role.request',target,{version:1,reasonCode:'review'}));
 let calls=0;const runtime=createRuntime({origin,fetch:async()=>{calls++;return json({});}},memorySessionStorage());
 try{await assert.rejects(()=>authorizeAuthMutation(runtime,intent(),factor),{code:'ADMIN_MFA_REQUIRED'});assert.equal(calls,0);}finally{runtime.session.dispose();}
});
test('a refused step-up never invokes the administrative operation',async()=>{
 let mutations=0;const runtime=await adminRuntime(path=>{if(path!=='/auth/admin/step-up')mutations++;return json({error:{code:'ADMIN_QUORUM_REQUIRED'}},403);});
 try{await assert.rejects(()=>authorizeAuthMutation(runtime,intent(),factor),{status:403});assert.equal(mutations,0);}finally{runtime.session.dispose();}
});
test('explicit cancellation prevents a late login response from accepting a session',async()=>{
 let finish!:(value:Response)=>void,meCalls=0;
 const runtime=createRuntime({origin,fetch:async url=>{
  if(String(url).endsWith('/auth/login'))return new Promise<Response>(resolve=>{finish=resolve;});
  meCalls++;return json({user:user()});
 }},memorySessionStorage());
 try{const attempt=runtime.session.signIn(credentials);while(!finish)await new Promise(resolve=>setImmediate(resolve));runtime.session.cancelAuthentication();finish(json(sessionBody()));await attempt;assert.equal(runtime.session.getSnapshot().status,'anonymous');assert.equal(runtime.session.currentToken(),undefined);assert.equal(meCalls,0);}finally{runtime.session.dispose();}
});
test('an active session expires locally without any refresh request',async context=>{
 context.mock.timers.enable({apis:['setTimeout']});let calls=0;
 const runtime=createRuntime({origin,fetch:async url=>{calls++;return json(String(url).endsWith('/auth/login')?{...sessionBody(),expiresIn:1}:{user:user()});}},memorySessionStorage());
 try{await runtime.session.signIn(credentials);assert.equal(runtime.session.getSnapshot().status,'authenticated');context.mock.timers.tick(1001);assert.equal(runtime.session.getSnapshot().status,'anonymous');assert.equal(runtime.session.currentToken(),undefined);assert.equal(calls,2);}finally{runtime.session.dispose();context.mock.timers.reset();}
});
test('cancelling during queued storage cleanup prevents the login or registration request from starting',async()=>{
 for(const operation of ['login','register'] as const){
  let release!:()=>void,clears=0,calls=0;
  const storage={async read(){return null;},async write(){},async clear(){clears++;if(clears===1)await new Promise<void>(resolve=>{release=resolve;});}};
  const runtime=createRuntime({origin,fetch:async()=>{calls++;return json(sessionBody());}},storage);
  try{
   const pending=operation==='login'?runtime.session.signIn(credentials):runtime.session.register({...credentials,name:'Conta fictícia'});
   while(!release)await new Promise(resolve=>setImmediate(resolve));runtime.session.cancelAuthentication();release();await pending;
   assert.equal(calls,0,operation+' must not start after cancellation');assert.equal(runtime.session.getSnapshot().status,'anonymous');
  }finally{runtime.session.dispose();}
 }
});
test('failed authentication cleanup cannot replace the state of a newer login',async()=>{
 let release!:()=>void,finishNew!:(response:Response)=>void,clears=0,logins=0,identities=0;
 const storage={async read(){return null;},async write(){},async clear(){clears++;if(clears===2)await new Promise<void>(resolve=>{release=resolve;});}};
 const runtime=createRuntime({origin,fetch:async url=>{
  if(String(url).endsWith('/auth/login')){logins++;return logins===1?json(sessionBody()):new Promise<Response>(resolve=>{finishNew=resolve;});}
  identities++;return identities===1?json({error:{code:'AUTH_UNAVAILABLE'}},503):json({user:user()});
 }},storage);
 let newer:Promise<void>|undefined;
 try{
  const older=runtime.session.signIn(credentials).catch(error=>error);
  while(!release)await new Promise(resolve=>setImmediate(resolve));newer=runtime.session.signIn(credentials);release();await older;
  while(!finishNew)await new Promise(resolve=>setImmediate(resolve));assert.equal(runtime.session.getSnapshot().status,'restoring');
 }finally{if(finishNew)finishNew(json(sessionBody()));await newer;runtime.session.dispose();}
});
test('failed identity validation after MFA discards the consumed challenge before another HTTP request',async()=>{
 let completions=0;
 const runtime=createRuntime({origin,fetch:async url=>{
  if(String(url).endsWith('/auth/login'))return json({challenge:'c'.repeat(64),mfaRequired:true,enrollmentRequired:false,expiresIn:600});
  if(String(url).endsWith('/auth/mfa/complete')){completions++;return json(sessionBody('administrador'));}
  return json({error:{code:'AUTH_UNAVAILABLE'}},503);
 }},memorySessionStorage());
 try{
  await runtime.session.signIn(credentials);await assert.rejects(()=>runtime.session.completeMfa({otp:'123456'}),{status:503});
  await assert.rejects(()=>runtime.session.completeMfa({otp:'123456'}),{code:'MFA_CHALLENGE_EXPIRED'});assert.equal(completions,1);assert.equal(runtime.session.currentToken(),undefined);
 }finally{runtime.session.dispose();}
});
