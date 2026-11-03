import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRuntime, decodeResource, executeManagementCommand, executePersonalCommand, memorySessionStorage, readResource, resourceQuery, resources, resourcesForPage, rowActions } from '../shared/src/index';
import type { Role } from '../shared/src/index';
const user={id:'a'.repeat(24),name:'Fictional',email:'test@example.invalid',userType:'utilizador',accountStatus:'active',roleVersion:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const auth=(path:string)=>path==='/auth/login'?json({user,accessToken:'synthetic',tokenType:'Bearer',expiresIn:3600}):path==='/auth/me'?json({user}):null;
test('all dashboard reads are existing public OpenAPI GET operations',()=>{
 const api=JSON.parse(readFileSync('../documentation/api/backend-release-v1.openapi.json','utf8'));
 for(const resource of Object.values(resources)){assert.ok(api.paths[resource.path]?.get,resource.path);assert.ok(!resource.path.includes('internal'));}
});
test('resource projections discard credentials, emails outside permitted fields and raw owner data',()=>{
 const view=decodeResource('measurements',{data:{items:[{id:'b'.repeat(24),kind:'weight',value:70,unit:'kg',ownerId:user.id,passwordHash:'hash-marker',token:'token-marker',email:'private@example.invalid'}],page:1,totalPages:1}});
 assert.deepEqual(view.rows[0]?.lines,['Medição: weight','Valor: 70','Unidade: kg']);
 assert.ok(!JSON.stringify(view).includes('marker'));assert.ok(!JSON.stringify(view).includes('private@example'));
 assert.throws(()=>decodeResource('plans',{data:{}}),{code:'INVALID_RESPONSE'});
});
test('manager metrics preserve suppression and unknown origins instead of reconstructing counts',()=>{
 const data=decodeResource('management-metrics',{data:{sources:[{source:'professional',status:'available',series:[{day:'2026-11-02',suppressed:true,value:3,range:{min:0,max:4}}]},{source:'agenda',status:'unavailable'},{source:'payment',status:'available',simulated:true,series:[{day:'2026-11-02',range:{min:10,max:14},value:null,suppressed:false}]}]}});
 assert.match(data.rows[0]!.lines[0]!,/suprimida/);assert.ok(!data.rows[0]!.lines[0]!.includes('3'));assert.match(data.rows[1]!.lines[0]!,/indisponível/);assert.match(data.rows[2]!.lines[0]!,/10–14.*simulados/);
 assert.throws(()=>resourceQuery('management-metrics',{from:'2026-01-01',to:'2026-03-01'}),{code:'VALIDATION_ERROR'});
});
test('no role can select another role resource via a route name',()=>{
 for(const role of ['utilizador','profissional','gestor','administrador'] as Role[]){assert.equal(resourcesForPage(role,'admin-users').length,role==='administrador'?1:0);assert.equal(resourcesForPage(role,'manager-cases').length,role==='gestor'?1:0);}
 assert.deepEqual(resourcesForPage('utilizador','coach'),[]);
});
test('unauthenticated reads and unauthorized resources make no HTTP request',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async()=>assert.fail('Unexpected HTTP')},memorySessionStorage());
 try{await assert.rejects(()=>readResource(runtime,'admin-users'),{code:'FORBIDDEN'});}finally{runtime.session.dispose();}
});
test('context ownership is rechecked after reads and after permission changes',async()=>{
 let release!:()=>void;const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async url=>{const path=new URL(String(url)).pathname;const session=auth(path);if(session)return session;await new Promise<void>(resolve=>{release=resolve;});return json({data:{items:[]}});}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});const read=readResource(runtime,'plans');await new Promise(resolve=>setImmediate(resolve));runtime.session.invalidate(runtime.session.currentToken());release();await assert.rejects(()=>read,{code:'SESSION_CHANGED'});}finally{runtime.session.dispose();}
});
test('measurement writes use Performance only and revalidate identity before a typed mutation',async()=>{
 const calls:{path:string;body:unknown}[]=[];const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url,init)=>{const path=new URL(String(url)).pathname;calls.push({path,body:init?.body?JSON.parse(String(init.body)):null});return auth(path)??json({data:{item:{id:'b'.repeat(24)}}},201);}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});await executePersonalCommand(runtime,{kind:'measurement',measurementKind:'weight',value:70,timezone:'Europe/Lisbon',idempotencyKey:'synthetic-key-001'});assert.equal(calls.at(-2)?.path,'/auth/me');assert.deepEqual(calls.at(-1),{path:'/performance/measurements',body:{kind:'weight',value:70,unit:'kg',timezone:'Europe/Lisbon',idempotencyKey:'synthetic-key-001'}});assert.ok(calls.every(call=>!call.path.startsWith('/users/me/measurements')));}finally{runtime.session.dispose();}
});
test('invalid command inputs fail before transport and state-driven actions never reopen final records',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async()=>assert.fail()},memorySessionStorage());
 try{await assert.rejects(()=>executePersonalCommand(runtime,{kind:'intake',amountMl:0,timezone:'Europe/Lisbon',idempotencyKey:'synthetic-key'}),{code:'VALIDATION_ERROR'});assert.deepEqual(rowActions('activities',{id:'b'.repeat(24),status:'completed',title:'Activity',lines:[]}),[]);assert.deepEqual(rowActions('training-sessions',{id:'b'.repeat(24),status:'planned',title:'Training',lines:[]}).map(item=>item.label),['Iniciar treino','Cancelar treino']);}finally{runtime.session.dispose();}
});
test('a write timeout stays unknown and is never automatically retried',async()=>{
 let writes=0;const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url)=>{const path=new URL(String(url)).pathname;const session=auth(path);if(session)return session;writes++;throw new Error('Fictional lost response');}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});await assert.rejects(()=>executePersonalCommand(runtime,{kind:'plan',title:'Fictional plan',environment:'home'}),{outcome:'unknown'});assert.equal(writes,1);}finally{runtime.session.dispose();}
});
test('manager mutations forward exact versions and canonical service IDs without granting scopes',async()=>{
 const manager={...user,userType:'gestor'},requests:{path:string;headers:Headers;body:unknown}[]=[];
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url,init)=>{const path=new URL(String(url)).pathname;if(path==='/auth/login')return json({user:manager,accessToken:'synthetic-manager',tokenType:'Bearer',expiresIn:3600});if(path==='/auth/me')return json({user:manager});requests.push({path,headers:new Headers(init?.headers),body:JSON.parse(String(init?.body))});return json({data:{id:'b'.repeat(24),version:3}});}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});await executeManagementCommand(runtime,{kind:'service',id:'b'.repeat(24),version:2,reasonCode:'operational_review',action:'suspend'});assert.equal(requests[0]?.headers.get('if-match'),'"'+'b'.repeat(24)+':2"');assert.deepEqual(requests[0]?.body,{reasonCode:'operational_review'});assert.ok(!JSON.stringify(requests[0]?.body).includes('scope'));await executeManagementCommand(runtime,{kind:'create-case',serviceId:'b'.repeat(24),reasonCode:'operational_review'});assert.deepEqual(requests[1]?.body,{serviceId:'b'.repeat(24),caseType:'service_operation',resourceOwnerService:'professional',resourceId:'b'.repeat(24),reasonCode:'operational_review'});}finally{runtime.session.dispose();}
});
test('manager scope revocation or expired permission remains a denial, never an empty result',async()=>{
 const manager={...user,userType:'gestor'},runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url)=>{const path=new URL(String(url)).pathname;if(path==='/auth/login')return json({user:manager,accessToken:'synthetic-manager',tokenType:'Bearer',expiresIn:3600});if(path==='/auth/me')return json({user:manager});return json({error:{code:'SCOPE_FORBIDDEN'}},403);}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});await assert.rejects(()=>readResource(runtime,'managed-services'),{status:403,code:'SCOPE_FORBIDDEN'});await assert.rejects(()=>executeManagementCommand(runtime,{kind:'service',id:'b'.repeat(24),version:1,reasonCode:'operational_review',action:'reactivate'}),{status:403});}finally{runtime.session.dispose();}
});
