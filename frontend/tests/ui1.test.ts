import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime, memorySessionStorage } from '../shared/src/index';
import type { Role } from '../shared/src/index';
import { webNavigation, readSidebarPreference, saveSidebarPreference, sidebarStorageKey, webRouteForPath } from '../web/src/navigation';
import { activitySummary, hydrationSummary, loadDashboard, planSummary, weightPoints } from '../web/src/dashboard/data';
test('Web groups are closed, ordered and role-specific; blocked Coach is not an active destination',()=>{
 const groups=webNavigation('utilizador');assert.deepEqual(groups.map(group=>group.label),['Principal','Serviços','Conta']);
 assert.deepEqual(groups[0]!.routes.map(route=>route.id),['dashboard-utilizador','training','hydration','measurements','agenda','history']);
 assert.deepEqual(groups[1]!.routes.map(route=>route.id),['catalog','bookings']);
 assert.deepEqual(groups[2]!.routes.map(route=>route.id),['profile','settings','security']);
 for(const role of ['profissional','gestor','administrador'] as Role[]){const routes=webNavigation(role).flatMap(group=>group.routes);assert.ok(!routes.some(route=>route.id==='training'||route.id==='coach'));if(role!=='administrador')assert.ok(!routes.some(route=>route.id.startsWith('admin-')));}
 assert.equal(webRouteForPath('/conta/definicoes')?.private,true);assert.equal(webRouteForPath('/internal/admin'),undefined);
});
test('sidebar persistence holds only a visual preference and denied storage remains usable',()=>{
 const entries=new Map<string,string>(),storage={getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{entries.set(key,value);}};
 assert.equal(readSidebarPreference(storage),false);assert.equal(saveSidebarPreference(storage,true),true);assert.equal(readSidebarPreference(storage),true);assert.deepEqual([...entries],[[sidebarStorageKey,'collapsed']]);
 assert.equal(saveSidebarPreference({setItem(){throw new Error();}},false),false);assert.equal(readSidebarPreference({getItem(){throw new Error();}}),false);
});
test('hydration preserves actual zero, absent goal and percentages above goal without invented defaults',()=>{
 assert.deepEqual(hydrationSummary({data:{totalMl:0,targetMl:null,percentage:null}}),{totalMl:0,targetMl:null,percentage:null});
 assert.equal(hydrationSummary({data:{totalMl:2400,targetMl:2000,percentage:120}}).percentage,120);
 assert.throws(()=>hydrationSummary({data:{}}),{code:'INVALID_RESPONSE'});assert.throws(()=>hydrationSummary({data:{totalMl:-1,targetMl:2000,percentage:0}}),{code:'INVALID_RESPONSE'});
});
test('weight chart selects valid kg points, orders actual instants and excludes unrelated fields',()=>{
 const points=weightPoints({data:{items:[{kind:'weight',value:73,unit:'kg',measuredAt:'2026-11-02T12:00:00Z',token:'never-project'},{kind:'waist',value:90,unit:'cm',measuredAt:'2026-11-01T12:00:00Z'},{kind:'weight',value:74,unit:'kg',measuredAt:'2026-10-30T12:00:00Z'},{kind:'weight',value:72,unit:'kg',measuredAt:'invalid'}]}});
 assert.deepEqual(points,[{value:74,at:'2026-10-30T12:00:00Z'},{value:73,at:'2026-11-02T12:00:00Z'}]);assert.ok(!JSON.stringify(points).includes('token'));
});
test('plan and agenda projections do not infer scheduled training, calories or professional associations',()=>{
 const plan=planSummary({data:{items:[{title:'Archived',status:'archived'},{title:'Own plan',status:'active',environment:'home',exercises:[{}],calories:800}]}});assert.deepEqual(plan,{title:'Own plan',environment:'home',exerciseCount:1});assert.equal(planSummary({data:{items:[]}}),null);
 const now=Date.parse('2026-11-02T12:00:00Z'),future={id:'b'.repeat(24),title:'Walk',kind:'personal',startAt:'2026-11-03T12:00:00Z',endAt:'2026-11-03T13:00:00Z',timezone:'Europe/Lisbon'};
 assert.deepEqual(activitySummary({data:{items:[{...future,status:'cancelled'},{...future,status:'planned'}]}},now),[future]);
});
const user={id:'a'.repeat(24),name:'Fictional',email:'ui1@example.invalid',userType:'utilizador',accountStatus:'active',roleVersion:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
test('dashboard partial failures stay unavailable; successful origins are independent and use only closed GETs',async()=>{
 const operations:string[]=[];const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url,init)=>{const path=new URL(String(url)).pathname;if(path==='/auth/login')return json({user,accessToken:'synthetic-ui1',tokenType:'Bearer',expiresIn:3600});if(path==='/auth/me')return json({user});operations.push(String(init?.method)+' '+path);if(path.startsWith('/hydration'))return json({error:{code:'UNAVAILABLE'}},503);return json({data:{items:[],total:0}});}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});const data=await loadDashboard(runtime,new AbortController().signal);assert.equal(data.hydration,null);assert.ok(data.errors.hydration);assert.deepEqual(data.weights,[]);assert.equal(data.activityTotal,0);assert.equal(operations.length,5);assert.ok(operations.every(item=>item.startsWith('GET /')&&!item.includes('internal')));}finally{runtime.session.dispose();}
});
test('anonymous or privileged identities cannot load a personal dashboard without their own authorized session',async()=>{
 const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async()=>assert.fail()},memorySessionStorage());
 try{await assert.rejects(()=>loadDashboard(runtime,new AbortController().signal),{code:'FORBIDDEN'});}finally{runtime.session.dispose();}
});
test('late dashboard responses cannot survive logout or change of identity',async()=>{
 let release!:()=>void;const runtime=createRuntime({origin:'https://unit.example.invalid',fetch:async(url)=>{const path=new URL(String(url)).pathname;if(path==='/auth/login')return json({user,accessToken:'synthetic-ui1',tokenType:'Bearer',expiresIn:3600});if(path==='/auth/me')return json({user});if(path.startsWith('/hydration')){await new Promise<void>(resolve=>{release=resolve;});return json({data:{totalMl:1000,targetMl:2000,percentage:50}});}return json({data:{items:[],total:0}});}},memorySessionStorage());
 try{await runtime.session.signIn({email:user.email,password:'fictional-password'});const result=loadDashboard(runtime,new AbortController().signal);await new Promise(resolve=>setImmediate(resolve));runtime.session.invalidate(runtime.session.currentToken());release();await assert.rejects(()=>result,{code:'SESSION_CHANGED'});}finally{runtime.session.dispose();}
});
