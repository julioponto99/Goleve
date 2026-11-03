import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, memorySessionStorage, authAdminIntent, authorizeAuthMutation } from '../shared/src/index';
const user={id:'a'.repeat(24),name:'Conta fictícia',email:'admin@example.invalid',userType:'administrador',accountStatus:'active',roleVersion:0,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
const authority={authority:'local-demo',demoInstanceId:'1234567890abcdef'};
const login={user,accessToken:'test-only-session',tokenType:'Bearer',expiresIn:3600};
const json=(body:unknown)=>new Response(JSON.stringify(body),{headers:{'Content-Type':'application/json'}});
const credentials={email:user.email,password:'fictional-unit-password'};
test('local-demo admin requires matching authority confirmed by Auth, never a UI-only flag',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async url=>json(String(url).endsWith('/auth/me')?{user,...authority}:{...login,...authority})},memorySessionStorage());
 try{await runtime.session.signIn(credentials);const state=runtime.session.getSnapshot();assert.equal(state.status,'authenticated');if(state.status==='authenticated')assert.equal(state.authority,'local-demo');}finally{runtime.session.dispose();}
});
test('a login-only demo declaration cannot bypass normal administrative MFA',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async url=>json(String(url).endsWith('/auth/me')?{user}:{...login,...authority})},memorySessionStorage());
 try{await assert.rejects(()=>runtime.session.signIn(credentials),{code:'AUTHORITY_MISMATCH'});assert.equal(runtime.session.currentToken(),undefined);}finally{runtime.session.dispose();}
});
test('demo step-up revalidates authority and sends only password with closed action binding',async()=>{
 const bodies:Record<string,unknown>[]=[];
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url,init)=>{
  const p=new URL(String(url)).pathname;if(p==='/auth/login')return json({...login,...authority});if(p==='/auth/me')return json({user,...authority});
  if(p==='/auth/admin/step-up'){bodies.push(JSON.parse(String(init?.body)));return json({data:{stepUpToken:'b'.repeat(64),expiresIn:300}});}
  return json({data:{id:'c'.repeat(24),version:2}});
 }},memorySessionStorage());
 try{await runtime.session.signIn(credentials);const intent=authAdminIntent('user.revoke','c'.repeat(24),{version:1,reasonCode:'demo_validation'}),proof=await authorizeAuthMutation(runtime,intent,{password:credentials.password});assert.equal(bodies.length,1);assert.equal(bodies[0]?.otp,undefined);assert.equal(bodies[0]?.recoveryCode,undefined);assert.equal(bodies[0]?.action,'user.revoke');await proof.run();await assert.rejects(()=>proof.run(),{code:'STEP_UP_CONSUMED'});}finally{runtime.session.dispose();}
});
test('normal admin cannot obtain password-only step-up',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async url=>{
  const route=new URL(String(url)).pathname;
  if(route==='/auth/login')return json({challenge:'d'.repeat(64),mfaRequired:true,enrollmentRequired:false,expiresIn:600});
  if(route==='/auth/mfa/complete')return json(login);
  return json({user});
 }},memorySessionStorage());
 try{await runtime.session.signIn(credentials);await runtime.session.completeMfa({otp:'123456'});assert.equal(runtime.session.getSnapshot().status,'authenticated');await assert.rejects(()=>authorizeAuthMutation(runtime,authAdminIntent('user.revoke','c'.repeat(24),{version:1,reasonCode:'demo_validation'}),{password:credentials.password}),{code:'VALIDATION_ERROR'});}finally{runtime.session.dispose();}
});
