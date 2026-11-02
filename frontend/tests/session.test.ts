import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, SessionController, memorySessionStorage, decodeAuth, decodeUser } from '../shared/src/index';
import type { SessionStorage } from '../shared/src/index';
const user={id:'a'.repeat(24),name:'Pessoa fictícia',email:'fictional@unit.invalid',userType:'utilizador',accountStatus:'active',roleVersion:0,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};
const origin='https://gateway.goleve.invalid';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const deferred=<T>()=>{let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return{promise,resolve};};
const login={email:user.email,password:'synthetic-input'};
test('Web memory session storage is isolated between application instances',async()=>{
 const a=memorySessionStorage(),b=memorySessionStorage();await a.write({token:'synthetic',expiresAt:123});
 assert.equal(await b.read(),null);await a.clear();assert.equal(await a.read(),null);
});
test('login validates current identity before becoming authenticated and persists only token/deadline',async()=>{
 const storage=memorySessionStorage();let checks=0;
 const {session}=createRuntime({origin,fetch:async(url,init)=>{
  if(String(url).endsWith('/auth/login'))return json({user,accessToken:'synthetic-token',tokenType:'Bearer',expiresIn:60});
  checks++;assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer synthetic-token');return json({user});
 }},storage);
 try{await session.signIn(login);const state=session.getSnapshot();assert.equal(state.status,'authenticated');assert.equal(checks,1);assert.deepEqual(Object.keys((await storage.read())!).sort(),['expiresAt','token']);assert(!JSON.stringify(state).includes('synthetic-token'));}
 finally{session.dispose();}
});
test('administrative MFA challenge never produces a session or persistent token',async()=>{
 const storage=memorySessionStorage();const {session}=createRuntime({origin,fetch:async()=>json({challenge:'synthetic-challenge',mfaRequired:true,enrollmentRequired:true,expiresIn:600})},storage);
 try{await session.signIn(login);assert.deepEqual(session.getSnapshot(),{status:'mfa-required',enrollmentRequired:true});assert.equal(session.currentToken(),undefined);assert.equal(await storage.read(),null);}
 finally{session.dispose();}
});
test('MFA completion uses the real challenge contract and then revalidates Auth',async()=>{
 const storage=memorySessionStorage();
 const {session}=createRuntime({origin,fetch:async(url,init)=>{
  if(String(url).endsWith('/auth/login'))return json({challenge:'synthetic-challenge',mfaRequired:true,enrollmentRequired:false,expiresIn:600});
  if(String(url).endsWith('/auth/mfa/complete')){assert.deepEqual(JSON.parse(String(init?.body)),{challenge:'synthetic-challenge',otp:'123456'});assert(!new Headers(init?.headers).has('Authorization'));return json({user:{...user,userType:'administrador'},accessToken:'mfa-test-token',tokenType:'Bearer',expiresIn:60});}
  return json({user:{...user,userType:'administrador'}});
 }},storage);
 try{await session.signIn(login);await session.completeMfa({otp:'123456'});assert.equal(session.getSnapshot().status,'authenticated');}
 finally{session.dispose();}
});
test('expired persisted credentials are cleared without making a request',async()=>{
 const storage=memorySessionStorage();await storage.write({token:'expired-synthetic',expiresAt:Date.now()-1});
 const {session}=createRuntime({origin,fetch:async()=>assert.fail()},storage);
 try{await session.restore();assert.equal(session.getSnapshot().status,'anonymous');assert.equal(await storage.read(),null);}
 finally{session.dispose();}
});
test('revoked session is removed after Auth 401',async()=>{
 const storage=memorySessionStorage();await storage.write({token:'revoked-synthetic',expiresAt:Date.now()+60000});
 const {session}=createRuntime({origin,fetch:async()=>json({error:{code:'INVALID_TOKEN'}},401)},storage);
 try{await session.restore();await new Promise(r=>setImmediate(r));assert.equal(session.getSnapshot().status,'anonymous');assert.equal(await storage.read(),null);}
 finally{session.dispose();}
});
test('failure to validate identity grants no private navigation and no active token',async()=>{
 const storage=memorySessionStorage();await storage.write({token:'synthetic',expiresAt:Date.now()+60000});
 const {session}=createRuntime({origin,fetch:async()=>json({error:{code:'DEPENDENCY_UNAVAILABLE'}},503)},storage);
 try{await session.restore();assert.equal(session.getSnapshot().status,'unavailable');assert.equal(session.currentToken(),undefined);}
 finally{session.dispose();}
});
test('current account role is read from Auth instead of cached login data',async()=>{
 const storage=memorySessionStorage();const {session}=createRuntime({origin,fetch:async(url)=>String(url).endsWith('/auth/login')?json({user:{...user,userType:'administrador'},accessToken:'synthetic',tokenType:'Bearer',expiresIn:60}):json({user})},storage);
 try{await session.signIn(login);const current=session.getSnapshot();assert(current.status==='authenticated');assert.equal(current.user.userType,'utilizador');}
 finally{session.dispose();}
});
test('logout clears local access even if the remote revocation fails',async()=>{
 const storage=memorySessionStorage();await storage.write({token:'synthetic',expiresAt:Date.now()+60000});
 const {session}=createRuntime({origin,fetch:async(url)=>String(url).endsWith('/auth/me')?json({user}):json({error:{code:'SERVICE_UNAVAILABLE'}},503)},storage);
 try{await session.restore();await assert.rejects(()=>session.signOut());assert.equal(session.getSnapshot().status,'anonymous');assert.equal(await storage.read(),null);}
 finally{session.dispose();}
});
test('late response from a revoked old session cannot erase a new login',async()=>{
 const old=deferred<Response>(),storage=memorySessionStorage();await storage.write({token:'old-synthetic',expiresAt:Date.now()+60000});
 const {session}=createRuntime({origin,fetch:async(url,init)=>{
  if(String(url).endsWith('/auth/login'))return json({user,accessToken:'new-synthetic',tokenType:'Bearer',expiresIn:60});
  return new Headers(init?.headers).get('Authorization')==='Bearer old-synthetic'?old.promise:json({user});
 }},storage);
 try{
  const restore=session.restore();await new Promise(r=>setImmediate(r));
  await session.signIn(login);old.resolve(json({error:{code:'INVALID_TOKEN'}},401));await restore;
  assert.equal(session.getSnapshot().status,'authenticated');assert.equal(session.currentToken(),'new-synthetic');
 }finally{session.dispose();}
});
test('late restore response cannot reopen a logged out session',async()=>{
 const response=deferred<Response>(),storage=memorySessionStorage();await storage.write({token:'synthetic',expiresAt:Date.now()+60000});
 const {session}=createRuntime({origin,fetch:async(url)=>String(url).endsWith('/auth/me')?response.promise:new Response(null,{status:204})},storage);
 try{const restore=session.restore();await new Promise(r=>setImmediate(r));await session.signOut();response.resolve(json({user}));await restore;assert.equal(session.getSnapshot().status,'anonymous');assert.equal(await storage.read(),null);}
 finally{session.dispose();}
});
test('sensitive/unknown response fields are projected out of the user DTO',()=>{
 const result=decodeUser({...user,passwordHash:'synthetic-for-test',mfaSecret:'synthetic-for-test'});assert.deepEqual(result,user);
 assert.throws(()=>decodeAuth({user,tokenType:'Bearer',expiresIn:60}));
});
test('storage failures never leave an authenticated session',async()=>{
 const storage:SessionStorage={read:async()=>null,write:async()=>{throw new Error('Storage unavailable');},clear:async()=>{}};
 const {session}=createRuntime({origin,fetch:async(url)=>String(url).endsWith('/auth/login')?json({user,accessToken:'synthetic',tokenType:'Bearer',expiresIn:60}):json({user})},storage);
 try{await assert.rejects(()=>session.signIn(login));assert.equal(session.getSnapshot().status,'anonymous');assert.equal(session.currentToken(),undefined);}
 finally{session.dispose();}
});
test('a failed secure-store deletion blocks local access without claiming successful logout',async()=>{
 const storage:SessionStorage={read:async()=>({token:'synthetic',expiresAt:Date.now()+60000}),write:async()=>{},clear:async()=>{throw new Error('Storage unavailable');}};
 const {session}=createRuntime({origin,fetch:async(url)=>String(url).endsWith('/auth/me')?json({user}):new Response(null,{status:204})},storage);
 try{await session.restore();await assert.rejects(()=>session.signOut(),{code:'SECURE_STORAGE_UNAVAILABLE'});assert.equal(session.currentToken(),undefined);assert.equal(session.getSnapshot().status,'anonymous');}
 finally{session.dispose();}
});
test('an expired MFA challenge is rejected before any completion request',async()=>{
 let now=0,calls=0;
 const api={request:async()=>{calls++;return{status:200,body:{challenge:'synthetic-challenge',mfaRequired:true,enrollmentRequired:false,expiresIn:1},etag:null,replayed:false};}};
 const session=new SessionController(api as never,memorySessionStorage(),()=>now);
 try{await session.signIn(login);now=1001;await assert.rejects(()=>session.completeMfa({otp:'123456'}),{code:'MFA_CHALLENGE_EXPIRED'});assert.equal(calls,1);assert.equal(session.currentToken(),undefined);}
 finally{session.dispose();}
});
