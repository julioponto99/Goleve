import { test, expect } from '@playwright/test';
import { ui1Login } from './ui1-fixture';
import { openSidebar } from './auth-fixture';
import type { Page } from '@playwright/test';
async function fit(page:Page){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
 const cards=await page.locator('.page-content .card').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right};}));
 const width=page.viewportSize()!.width;for(const card of cards){expect(card.left).toBeGreaterThanOrEqual(0);expect(card.right).toBeLessThanOrEqual(width+1);}
}
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort('blockedbyclient'));});
if(process.env.GOLEVE_UI1_CAPTURE==='before'){
 test('capturas antes do redesign',async({page},info)=>{
  await ui1Login(page);
  for(const theme of ['light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
   await page.screenshot({path:info.outputPath('before-'+theme+'.png'),fullPage:true});
  }
 });
}
else{
 test('composição, dados e capturas depois em Light/Dark',async({page},info)=>{
  await ui1Login(page);await expect(page.getByRole('heading',{name:'O teu dia num relance'})).toBeVisible();await expect(page.getByText('1,2 L',{exact:true})).toBeVisible();await expect(page.getByRole('img',{name:/Peso registado: 7 medições/})).toBeVisible();await expect(page.getByText('Caminhada no parque',{exact:true})).toBeVisible();
  for(const theme of ['light','dark']){
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
   await fit(page);const header=await page.locator('.page-header').boundingBox();expect(header?.y).toBe(0);expect(header?.height).toBe(80);
   await page.screenshot({path:info.outputPath('after-'+theme+'.png'),fullPage:true});
  }
  const original=await page.locator('.page-header').boundingBox(),footer=page.viewportSize()!.width>=1024?await page.locator('.sidebar-footer').boundingBox():null;
  await page.locator('.page-content').evaluate(node=>{node.scrollTop=node.scrollHeight;});
  expect(await page.locator('.page-header').boundingBox()).toEqual(original);if(footer)expect(await page.locator('.sidebar-footer').boundingBox()).toEqual(footer);expect(await page.evaluate(()=>window.scrollY)).toBe(0);await page.screenshot({path:info.outputPath('after-detail-scroll.png'),fullPage:true});
 });
 test('menu adaptativo, tooltips, foco, preferências e navegação',async({page},info)=>{
  await ui1Login(page);const trigger=page.getByRole('button',{name:'Abrir menu'});
  if(page.viewportSize()!.width>=1024){
   await trigger.click();await expect(page.locator('.app-shell')).toHaveAttribute('data-sidebar','collapsed');expect((await page.locator('.sidebar').boundingBox())?.width).toBe(80);
   const target=page.getByRole('link',{name:'Treinos',exact:true});await target.hover();await expect(page.getByRole('tooltip')).toHaveText('Treinos');await target.focus();await expect(page.getByRole('tooltip')).toBeVisible();
   await page.mouse.move(page.viewportSize()!.width-20,20);await page.getByRole('button',{name:'Alterar tema'}).focus();await expect(page.getByRole('tooltip')).toHaveCount(0);
   await page.screenshot({path:info.outputPath('collapsed.png'),fullPage:true});
   await target.click();await expect(page).toHaveURL(/\/treinos$/);expect(await page.evaluate(()=>localStorage.getItem('goleve.ui.sidebar.v1'))).toBe('collapsed');
   await page.reload();await expect(page).toHaveURL(/\/entrar$/);await page.getByLabel('E-mail',{exact:true}).fill('web@example.invalid');await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByRole('button',{name:'Iniciar sessão',exact:true}).click();await expect(trigger).toBeVisible();await expect(page.locator('.app-shell')).toHaveAttribute('data-sidebar','collapsed');
   await trigger.click();expect((await page.locator('.sidebar').boundingBox())?.width).toBe(240);
  }else{
   await trigger.click();await expect(page.getByRole('dialog',{name:'Navegação principal'})).toBeVisible();expect(await page.locator('.main-shell').evaluate(node=>(node as HTMLElement).inert)).toBe(true);
   await expect(page.getByRole('link',{name:'GoLeve',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Terminar sessão',exact:true})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'GoLeve',exact:true})).toBeFocused();
   await expect(page.locator('.sidebar')).toHaveCSS('transform','none');const footer=await page.locator('.sidebar-footer').boundingBox();await page.locator('.sidebar-scroll').evaluate(node=>{node.scrollTop=node.scrollHeight;});expect(await page.locator('.sidebar-footer').boundingBox()).toEqual(footer);
   await page.screenshot({path:info.outputPath('overlay.png'),fullPage:true});await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
   await trigger.click();await page.locator('.menu-backdrop').click({position:{x:page.viewportSize()!.width-10,y:200}});await expect(trigger).toHaveAttribute('aria-expanded','false');
   await trigger.click();await page.getByRole('link',{name:'Agenda',exact:true}).click();await expect(page).toHaveURL(/\/agenda$/);await expect(trigger).toHaveAttribute('aria-expanded','false');
  }
  await fit(page);await openSidebar(page);await expect(page.getByRole('navigation',{name:'Principal',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Serviços',exact:true})).toBeVisible();await expect(page.getByRole('navigation',{name:'Conta',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Coach IA',exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:'Definições',exact:true}).click();await expect(page).toHaveURL(/\/conta\/definicoes$/);await expect(page.getByRole('heading',{name:'Preferências',exact:true})).toBeVisible();
 });
 for(const role of ['profissional','gestor','administrador'] as const)test('painel e menu do perfil '+role,async({page},info)=>{
  const fake=await ui1Login(page,role);for(const theme of ['light','dark']){if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();await fit(page);await page.screenshot({path:info.outputPath(role+'-'+theme+'.png'),fullPage:true});}
  await openSidebar(page);await expect(page.getByRole('link',{name:'Treinos',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Coach IA',exact:true})).toHaveCount(0);
  if(role!=='administrador')await expect(page.getByRole('link',{name:'Utilizadores e papéis',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Terminar sessão',exact:true}).click();await expect(page).toHaveURL(/\/entrar$/);expect(fake.requests.filter(row=>row.path==='/auth/logout')).toHaveLength(1);
 });
 test('ausência e falhas não criam métricas, gráficos ou pagamentos fictícios',async({page})=>{
  await ui1Login(page);
  await page.route(url=>url.pathname==='/hydration/intakes/daily',route=>route.fulfill({status:503,json:{error:{code:'UNAVAILABLE'}}}));
  await page.route(url=>url.pathname==='/performance/measurements',route=>route.fulfill({json:{data:{items:[],total:0,page:1,totalPages:0}}}));
  await page.getByRole('button',{name:'Atualizar resumo'}).click();await expect(page.getByText('Hidratação indisponível',{exact:true})).toBeVisible();await expect(page.locator('.weight-chart')).toHaveCount(0);
  await expect(page.getByText('Regista pelo menos duas medições de peso para acompanhar a evolução.')).toBeVisible();await expect(page.getByText('98 KG',{exact:true})).toHaveCount(0);await expect(page.getByText('+100 pts',{exact:false})).toHaveCount(0);
  await page.getByRole('button',{name:'Registar água',exact:false}).click();await expect(page).toHaveURL(/\/hidratacao$/);await expect(page.getByRole('button',{name:'Registar consumo',exact:true})).toBeVisible();
 });
}
