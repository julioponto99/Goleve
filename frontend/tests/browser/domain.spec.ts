import { test, expect } from '@playwright/test';
import { login, mockAuth, openSidebar } from './auth-fixture';
import type { Page } from '@playwright/test';
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort('blockedbyclient'));});
async function navigate(page:Page,label:string){await openSidebar(page);await page.getByRole('link',{name:label,exact:true}).click();}
const id='b'.repeat(24);
const apiPath=(path:string)=>(url:URL)=>url.origin==='http://127.0.0.1:64344'&&url.pathname===path;
test('hydration reads the service, validates intake and goal DTOs and refreshes after success',async({page},info)=>{
 const fake=await mockAuth(page);let consumed=500;
 await page.route('http://127.0.0.1:64344/hydration/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/hydration/intakes'&&route.request().method()==='POST'){const input=route.request().postDataJSON();expect(input.amountMl).toBe(250);expect(input.idempotencyKey).toMatch(/^[a-f0-9-]{36}$/);expect(input.ownerId).toBeUndefined();consumed+=250;return route.fulfill({status:201,json:{data:{item:{id},created:true}}});}
  if(path==='/hydration/goal'&&route.request().method()==='PUT'){expect(route.request().postDataJSON()).toMatchObject({targetMl:2000,version:2});return route.fulfill({json:{data:{id,targetMl:2000,version:3}}});}
  return route.fulfill({json:{data:path.endsWith('/daily')?{totalMl:consumed,targetMl:2000,percentage:consumed/20,date:'2026-11-02',timezone:'Europe/Lisbon'}:path.endsWith('/goal')?{id,targetMl:2000,version:2,timezone:'Europe/Lisbon'}:{items:[],page:1,totalPages:0}}});
 });
 await login(page);await expect(page.getByText('0,5 L',{exact:true})).toBeVisible();await navigate(page,'Hidratação');await page.getByLabel('Consumo (ml)',{exact:true}).fill('250');await page.getByRole('button',{name:'Registar consumo',exact:true}).click();await expect(page.getByText('Consumo (ml): 750')).toBeVisible();
 await page.getByLabel('Meta diária (ml)',{exact:true}).fill('2000');await page.getByRole('button',{name:'Guardar meta',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Operação confirmada pelo serviço.'})).toBeVisible();
 expect(fake.requests.filter(row=>row.path==='/auth/me').length).toBeGreaterThanOrEqual(3);await page.screenshot({path:info.outputPath('hydration-mocked.png'),fullPage:true});
});
test('measurements write only to Performance and never duplicate User measurements',async({page})=>{
 const fake=await mockAuth(page);let created=false;
 await page.route(apiPath('/performance/measurements'),async route=>{
  if(route.request().method()==='POST'){expect(route.request().postDataJSON()).toMatchObject({kind:'weight',value:72,unit:'kg'});created=true;return route.fulfill({status:201,json:{data:{item:{id}}}});}
  return route.fulfill({json:{data:{items:created?[{id,kind:'weight',value:72,unit:'kg',measuredAt:'2026-11-02T10:00:00Z'}]:[],page:1,totalPages:created?1:0}}});
 });
 await login(page);await navigate(page,'Medições');await page.getByLabel('Valor medido').fill('72');await page.getByRole('button',{name:'Guardar medição'}).click();await expect(page.getByText('Valor: 72')).toBeVisible();expect(fake.requests.some(row=>row.path.includes('/users/me/measurements'))).toBe(false);
});
test('training session actions follow server states rather than assuming completion',async({page})=>{
 await mockAuth(page);let status='planned';
 await page.route('http://127.0.0.1:64344/training/sessions**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/start'))status='running';if(path.endsWith('/complete'))status='completed';
  return route.fulfill({json:{data:route.request().method()==='GET'?{items:[{id,status,version:1}],page:1,totalPages:1}:{id,status}}});
 });
 await login(page);await navigate(page,'Treinos');await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();await expect(page.getByText('Estado: running')).toBeVisible();await page.getByRole('button',{name:'Concluir treino',exact:true}).click();await expect(page.getByText('Estado: completed')).toBeVisible();await expect(page.getByRole('button',{name:'Iniciar treino',exact:true})).toHaveCount(0);
});
test('personal agenda uses UTC instants and server overlap warnings without creating professional bookings',async({page})=>{
 const fake=await mockAuth(page);await page.route(apiPath('/agenda/activities'),async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{data:{items:[],page:1,totalPages:0}}});
  const body=route.request().postDataJSON();expect(body.kind).toBe('personal');expect(body.startAt).toMatch(/Z$/);expect(body.environment).toBeUndefined();return route.fulfill({status:201,json:{data:{activity:{id},overlapWarning:true,overlaps:['c'.repeat(24)]}}});
 });
 await login(page);await navigate(page,'Agenda');await page.getByLabel('Título da atividade').fill('Atividade fictícia');await page.getByLabel('Início (hora local)').fill('2027-01-01T10:00');await page.getByLabel('Fim (hora local)').fill('2027-01-01T11:00');await page.getByRole('button',{name:'Criar atividade',exact:true}).click();await expect(page.getByText('Atividade guardada. Há sobreposição',{exact:false})).toBeVisible();expect(fake.requests.some(row=>row.path.includes('professional-appointments'))).toBe(false);
});
test('manager data honours suppressed counts, unavailable sources and scoped concurrency conflicts',async({page})=>{
 await mockAuth(page,{role:'gestor'});
 await page.route(apiPath('/management/dashboard'),route=>route.fulfill({json:{data:{sources:[{source:'professional',status:'available',series:[{day:'2026-11-02',suppressed:true,value:3,range:null}]},{source:'agenda',status:'unavailable'}]}}}));
 await page.route('http://127.0.0.1:64344/management/services**',route=>route.request().method()==='GET'?route.fulfill({json:{data:{items:[{id,name:'Serviço fictício no âmbito',active:true,version:2}],nextBefore:null}}}):route.fulfill({status:412,json:{error:{code:'VERSION_CONFLICT'}}}));
 await login(page);await expect(page.getByText('Contagem suprimida para proteger a privacidade')).toBeVisible();await expect(page.getByText('Origem indisponível; não é apresentado zero.')).toBeVisible();
 await navigate(page,'Serviços sob gestão');await page.getByLabel('Código do motivo').fill('operational_review');await page.getByRole('button',{name:'Suspender serviço',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Os dados foram alterados'})).toBeVisible();
 await openSidebar(page);await expect(page.getByRole('link',{name:'Utilizadores e papéis',exact:true})).toHaveCount(0);
});
test('Administrator operation obtains a proof for the exact server row and rejects self-service shortcuts',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador'});
 await page.route(apiPath('/auth/administration/users'),route=>route.fulfill({json:{data:{items:[{id,name:'Conta fictícia alvo',userType:'utilizador',accountStatus:'active',version:2}],nextBefore:null}}}));
 await login(page);await page.getByLabel('Código da aplicação').fill('123456');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();await expect(page.getByText('Conta fictícia alvo')).toBeVisible();
 await page.getByLabel('Código do motivo').fill('operational_review');await page.getByRole('button',{name:'Revogar acessos',exact:true}).click();await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar esta operação'}).click();await expect(page.getByText('Operação confirmada pelo Auth.')).toBeVisible();
 const proof=fake.requests.find(row=>row.path==='/auth/admin/step-up');expect(proof?.body).toMatchObject({action:'user.revoke',targetId:id,parameters:{version:2,reasonCode:'operational_review'}});expect(fake.requests.filter(row=>row.path.endsWith('/revoke'))).toHaveLength(1);expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
});
test('Professional eligibility denials stay unavailable without enabling synthetic approval',async({page})=>{
 const fake=await mockAuth(page,{role:'profissional'});await page.route(apiPath('/agenda/professional/appointments'),route=>route.fulfill({status:403,json:{error:{code:'PROFESSIONAL_INELIGIBLE'}}}));
 await login(page);await expect(page.getByRole('heading',{name:'Consulta não autorizada'})).toBeVisible();await openSidebar(page);await expect(page.getByRole('link',{name:'Serviços sob gestão'})).toHaveCount(0);expect(fake.requests.some(row=>row.method!=='GET'&&!row.path.startsWith('/auth'))).toBe(false);
});
test('unknown mutation outcomes remain blocked and never retry automatically',async({page})=>{
 await mockAuth(page);let attempts=0;await page.route('http://127.0.0.1:64344/hydration/intakes',async route=>{if(route.request().method()==='POST'){attempts++;return route.abort();}return route.fulfill({json:{data:{items:[],page:1,totalPages:0}}});});
 await login(page);await navigate(page,'Hidratação');await page.getByLabel('Consumo (ml)',{exact:true}).fill('250');await page.getByRole('button',{name:'Registar consumo'}).click();await expect(page.getByText('Resultado por confirmar.',{exact:false})).toBeVisible();await expect(page.getByRole('button',{name:'Registar consumo'})).toBeDisabled();expect(attempts).toBe(1);
});
