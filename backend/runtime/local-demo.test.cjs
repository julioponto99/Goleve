'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const demo=require('./local-demo.cjs');
let dir,env,manifest;
const saved={...process.env};
before(()=>{
 dir=fs.mkdtempSync(path.join(os.tmpdir(),'goleve-local-policy-'));
 manifest={version:1,instance:'1234567890abcdef',expiresAt:new Date(Date.now()+86400000).toISOString(),resources:{ptService:'aaaaaaaaaaaaaaaaaaaaaaaa',nutritionService:'bbbbbbbbbbbbbbbbbbbbbbbb'},accounts:demo.accounts.map(([role,email],i)=>({role,email,id:String(i+1).padStart(24,'0')}))};
 fs.writeFileSync(path.join(dir,'identities.json'),JSON.stringify(manifest));fs.writeFileSync(path.join(dir,'identity.key'),crypto.randomBytes(32).toString('hex'));
 env={NODE_ENV:'test',GOLEVE_LOCAL_DEMO_ENABLED:'true',GOLEVE_RUNTIME_MODE:'local-demo',GOLEVE_LOCAL_DEMO_INSTANCE:manifest.instance,LOCAL_DEMO_GATEWAY_ORIGIN:'http://127.0.0.1:3000',LOCAL_DEMO_IDENTITIES_FILE:path.join(dir,'identities.json'),LOCAL_DEMO_IDENTITY_KEY_FILE:path.join(dir,'identity.key')};
 Object.assign(process.env,env);process.env.JWT_SECRET=crypto.randomBytes(32).toString('hex');
});
after(()=>{for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);const target=path.resolve(dir);if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('goleve-local-policy-'))throw Error('Unsafe cleanup');fs.rmSync(target,{recursive:true});});
test('policy is disabled by default',()=>assert.equal(demo.policy({}),undefined));
test('production always rejects active local demo',()=>assert.throws(()=>demo.policy({...env,NODE_ENV:'production'}),/forbidden/));
test('explicit runtime and loopback gateway are mandatory',()=>{assert.throws(()=>demo.policy({...env,GOLEVE_RUNTIME_MODE:'production'}));assert.throws(()=>demo.policy({...env,LOCAL_DEMO_GATEWAY_ORIGIN:'http://0.0.0.0:3000'}));});
test('exactly five approved identities and valid lifetime',()=>{assert.equal(demo.policy(env).accounts.length,5);assert.throws(()=>demo.policy(env,Date.now()+2*86400000),/expired/);});
test('stored demo marker, ID, email and role must all match',()=>{
 const a=manifest.accounts[4];assert.equal(demo.account({...a,id:a.id,userType:a.role,localDemoInstanceId:manifest.instance},env).authority,'local-demo');
 assert.throws(()=>demo.account({...a,userType:'utilizador',localDemoInstanceId:manifest.instance},env));
 assert.throws(()=>demo.account({...a,id:'ffffffffffffffffffffffff',localDemoInstanceId:manifest.instance},env));
 assert.equal(demo.account({...a,userType:a.role},env),undefined);
});
test('demo accounts cannot authenticate outside mode',()=>assert.throws(()=>demo.account({...manifest.accounts[0],localDemoInstanceId:manifest.instance},{GOLEVE_LOCAL_DEMO_ENABLED:'false'})));
test('owner refuses demo authority in production or without matching manifest',()=>{
 const a=manifest.accounts[0],b={authority:'local-demo',demoInstanceId:manifest.instance,user:{...a,userType:a.role}};
 assert.equal(demo.identityEnvelope(b,env).authority,'local-demo');assert.throws(()=>demo.identityEnvelope(b,{}));assert.throws(()=>demo.identityEnvelope({...b,demoInstanceId:'other'},env));assert.throws(()=>demo.identityEnvelope({user:b.user},env));
});
test('normal identities keep standard authority',()=>assert.equal(demo.identityEnvelope({user:{id:'ffffffffffffffffffffffff',userType:'administrador'}},env).authority,'standard'));
test('no global roles, invitations or independent approvals through demo step-up',()=>{
 const a={...manifest.accounts[4],userType:'administrador',localDemoInstanceId:manifest.instance};
 assert.doesNotThrow(()=>demo.assertAction(a,'user.revoke',manifest.accounts[0].id,{}));
 for(const action of ['role.request','role.approve','manager.invite','management.assignment.approve','quorum.invite'])assert.throws(()=>demo.assertAction(a,action,manifest.accounts[0].id,{}));
 assert.throws(()=>demo.assertAction(a,'user.suspend','ffffffffffffffffffffffff',{}));
});
test('normal eligibility database restrictions are not broadened without mode',()=>{assert.equal(demo.permitsDemoDatabase('payment','goleve_payment',{}),false);assert.equal(demo.permitsDemoDatabase('payment','goleve_auth',env),false);assert.equal(demo.permitsDemoDatabase('payment','goleve_payment',env),true);});
test('internal identity assertion has audience, expiry, body binding and independent key',()=>{
 const body={id:manifest.accounts[1].id},assertion=demo.identityAssertion(body);assert.match(demo.verifyIdentityAssertion(assertion,body),/^[a-f0-9-]{36}$/);
 assert.throws(()=>demo.verifyIdentityAssertion(assertion,{id:manifest.accounts[0].id}));assert.throws(()=>demo.verifyIdentityAssertion(assertion.slice(0,-1)+(assertion.endsWith('a')?'b':'a'),body));assert.throws(()=>demo.verifyIdentityAssertion(undefined,body));
});
test('JWT marks demo authority and is rejected when mode is disabled',()=>{
 const token=require('../services/auth-service/dist/config/token'),jwt=token.signAccessToken(manifest.accounts[0].id,'a'.repeat(64),0,manifest.instance);
 assert.equal(JSON.parse(Buffer.from(jwt.split('.')[1],'base64url')).authority,'local-demo');assert.equal(token.verifyTokenClaims(jwt).demoInstanceId,manifest.instance);
 process.env.GOLEVE_LOCAL_DEMO_ENABLED='false';try{assert.throws(()=>token.verifyTokenClaims(jwt));}finally{process.env.GOLEVE_LOCAL_DEMO_ENABLED='true';}
});
test('real administrators still require MFA before session issuance',async()=>{
 const {SecurityService}=require('../services/auth-service/dist/administration/security.service');
 await assert.rejects(()=>new SecurityService().issueSession({_id:'ffffffffffffffffffffffff',userType:'administrador',accountStatus:'active',mfaEnabled:false},false),e=>e.code==='MFA_REQUIRED');
});
test('regular users and professionals cannot read synthetic manager grants',async()=>{
 const {ManagementService}=require('../services/management-service/dist/services/management.service');
 const service=new ManagementService({}, {}, {});
 for(const role of ['utilizador','profissional'])await assert.rejects(()=>service.listAssignments({identity:{id:manifest.accounts[0].id,userType:role,authority:'local-demo',demoInstanceId:manifest.instance},bearer:'test-only',requestId:'test-only'},{}),e=>e.statusCode===403&&e.code==='MANAGER_REQUIRED');
});
