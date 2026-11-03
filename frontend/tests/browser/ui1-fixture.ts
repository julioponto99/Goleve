import { mockAuth, login } from './auth-fixture';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { Role } from '../../shared/src/index';
export async function ui1Login(page:Page,role:Role='utilizador'){
 const fake=await mockAuth(page,{role}),now=Date.now(),id='b'.repeat(24),iso=(days:number)=>new Date(now+days*86400000).toISOString();
 await page.route('http://127.0.0.1:64344/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'||path.startsWith('/auth'))return route.fallback();
  const list=(items:unknown[])=>({items,page:1,pageSize:20,total:items.length,totalPages:items.length?1:0,nextBefore:null});
  const measurements=[76.4,76,75.7,75.9,75.3,75.1,74.8].map((value,n)=>({id:(n+1).toString(16).padStart(24,'0'),kind:'weight',unit:'kg',value,measuredAt:iso(n-6),timezone:'Europe/Lisbon'}));
  const plans=[{id,title:'Força em casa',description:'Treino pessoal com exercícios de peso corporal.',status:'active',environment:'home',version:1,exercises:[{exerciseId:'c'.repeat(24)},{exerciseId:'d'.repeat(24)}]}];
  const activities=[{id,title:'Caminhada no parque',kind:'personal',status:'planned',startAt:iso(.08),endAt:iso(.1),timezone:'Europe/Lisbon'},{id:'c'.repeat(24),title:'Mobilidade em casa',kind:'workout',environment:'home',status:'planned',startAt:iso(1.1),endAt:iso(1.12),timezone:'Europe/Lisbon'},{id:'d'.repeat(24),title:'Corrida ao ar livre',kind:'personal',status:'planned',startAt:iso(3.1),endAt:iso(3.14),timezone:'Europe/Lisbon'}];
  let data:unknown;
  if(path==='/hydration/intakes/daily')data={totalMl:1200,targetMl:2000,percentage:60,date:new Date().toISOString().slice(0,10),timezone:'Europe/Lisbon',items:[]};
  else if(path==='/training/plans')data=list(plans);
  else if(path==='/training/sessions')data=list([{id,status:'planned',version:1,createdAt:iso(-1)}]);
  else if(path==='/performance/summary')data={latestMeasurements:[...measurements].reverse(),steps:{},heartRate:{}};
  else if(path==='/performance/measurements')data=list([...measurements].reverse());
  else if(path==='/agenda/activities')data=list(activities);
  else if(path==='/management/me')data={assignments:{items:[{id,scopeId:'c'.repeat(24),status:'active',validFrom:iso(-1),validUntil:iso(7)}],nextBefore:null}};
  else if(path==='/management/dashboard')data={sources:[{source:'professional',status:'available',series:[{day:new Date().toISOString().slice(0,10),value:null,suppressed:false,range:{min:10,max:14}}]},{source:'agenda',status:'available',series:[{day:new Date().toISOString().slice(0,10),value:null,suppressed:true,range:null}]},{source:'payment',status:'unavailable'}]};
  else if(path==='/management/cases')data=list([{id,version:1,caseType:'service_operation',status:'open',reasonCode:'operational_review',serviceId:'c'.repeat(24)}]);
  else if(path==='/professionals/me/application-status')data={status:'submitted',submittedAt:iso(-1)};
  else if(path==='/professionals/me/services')data=list([{id,name:'Treino individual',active:false,priceEur:25,durationMinutes:60,category:'personal_trainer',version:1}]);
  else if(path==='/notifications/unread-count')data={count:2};
  else return route.fallback();
  return route.fulfill({json:{data}});
 });
 await login(page);
 if(role==='administrador'){await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();}
 await expect(page.getByRole('heading',{name:'Olá, '+fake.user.name+'.',exact:true})).toBeVisible();
 await page.evaluate(()=>document.fonts.ready);
 return fake;
}
