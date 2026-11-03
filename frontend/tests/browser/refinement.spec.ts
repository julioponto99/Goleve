import { test, expect } from '@playwright/test';
import path from 'node:path';
import { openSidebar, readyUser } from './auth-fixture';
test.beforeEach(async({page,baseURL})=>{
 await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort('blockedbyclient'));
});
async function openMenu(page:import('@playwright/test').Page){
 await openSidebar(page);
}
test('Web starts Light even on a Dark system, and persists only the explicit theme across reload',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Alterar tema'}).click();await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 expect(await page.evaluate(()=>({...localStorage}))).toEqual({'goleve.ui.theme.v1':'dark'});
 expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
});
test('unavailable preference storage does not break the theme switch or pretend persistence',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Disabled','SecurityError');};});
 await page.goto('/');await page.getByRole('button',{name:'Alterar tema'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.getByText('O tema foi aplicado, mas não foi possível guardar a preferência neste navegador.')).toBeVisible();
});
test('every authorized area is reachable and returns to its verified dashboard without fabricated data',async({page})=>{
 await readyUser(page);
 for(const [label,url] of [['Treinos','/treinos'],['Medições','/medidas'],['Hidratação','/hidratacao'],['Agenda','/agenda'],['Histórico','/historico'],['Perfil','/perfil']]){
  await openMenu(page);await page.getByRole('link',{name:label,exact:label!=='Coach IA'}).click();
  await expect(page).toHaveURL(new RegExp(url+'$'));await expect(page.locator('.page-header h1')).toHaveText(url==='/agenda'?'Agenda pessoal':url==='/perfil'?'Perfil pessoal':url==='/medidas'?'Medidas':label);
  if(url==='/coach')await expect(page.getByRole('heading',{name:'Coach IA indisponível'})).toBeVisible();
  await page.locator('.breadcrumbs a').click();await expect(page).toHaveURL(/\/painel\/utilizador$/);
 }
});
test('sidebar icons remain single, crisp and fixed-size in both active states and themes',async({page})=>{
 await readyUser(page);
 for(const theme of ['light','dark']){
  await openMenu(page);await page.getByRole('link',{name:'Treinos',exact:true}).click();if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
  await openMenu(page);
  const icons=await page.locator('.nav-icon').evaluateAll(nodes=>nodes.map(node=>{
   const s=getComputedStyle(node),r=node.getBoundingClientRect();return {width:r.width,height:r.height,filter:s.filter,shadow:s.boxShadow,textShadow:s.textShadow,transform:s.transform,siblings:node.parentElement!.querySelectorAll('img').length};
  }));
  expect(icons.length).toBeGreaterThanOrEqual(7);for(const icon of icons)expect(icon).toEqual({width:20,height:20,filter:'none',shadow:'none',textShadow:'none',transform:'none',siblings:1});
  const link=page.getByRole('link',{name:'Treinos',exact:true});await expect(link).toHaveAttribute('aria-current','page');
  await page.keyboard.press('Escape');
 }
});
test('resizing an open drawer restores access and scrolling instead of leaving the page inert',async({page})=>{
 await page.setViewportSize({width:402,height:874});await readyUser(page);await openMenu(page);
 expect(await page.locator('.main-shell').evaluate(node=>node instanceof HTMLElement&&node.inert)).toBe(true);
 await page.setViewportSize({width:1024,height:900});
 await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
 expect(await page.locator('.main-shell').evaluate(node=>node instanceof HTMLElement&&node.inert)).toBe(false);
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');
 await page.getByRole('button',{name:'Alterar tema'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('layout fits narrow screens and tablets in both themes, including long route headings',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await readyUser(page);
 for(const width of [320,375,402,768,1024,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:874});await page.evaluate(()=>{history.pushState(null,'','/perfil');dispatchEvent(new PopStateEvent('popstate'));});await expect(page.locator('.page-header h1')).toHaveText('Perfil pessoal');
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+theme).toBe(true);
  const actions=page.getByRole('button',{name:'Alterar tema'});await expect(actions).toBeInViewport();
  await page.locator('.breadcrumbs a').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(errors).toEqual([]);
});
test('a pending connection disables repeated submission and a failure can be retried explicitly',async({page})=>{
 await readyUser(page);
 let respond!:()=>void,count=0;
 await page.route('http://127.0.0.1:64344/health',async route=>{count++;await new Promise<void>(resolve=>{respond=resolve;});await route.fulfill({status:503,contentType:'application/json',body:'{}'});});
 const trigger=page.getByRole('button',{name:'Verificar ligação'});await trigger.click();
 await expect(trigger).toBeDisabled();await expect(page.getByRole('status').filter({hasText:'A verificar a ligação'})).toBeVisible();
 await expect.poll(()=>count).toBe(1);respond();
 await expect(page.getByRole('heading',{name:'Ligação indisponível'})).toBeVisible();await expect(trigger).toBeEnabled();
 await page.route('http://127.0.0.1:64344/health',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
 await trigger.click();await expect(page.getByText('Ligação verificada.',{exact:true})).toBeVisible();expect(count).toBe(1);
});
test('the existing dialog closes once via Escape or its button, and field errors are accessible',async({page})=>{
 const fixture=path.resolve('tests/fixtures/ui-harness.tsx').replaceAll('\\','/');
 await page.route('**/__test/ui',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="pt"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${fixture}"></script></body></html>`}));
 await page.goto('/__test/ui');const trigger=page.getByRole('button',{name:'Abrir diálogo de teste'});await trigger.click();
 await expect(page.getByRole('dialog')).toBeVisible();const input=page.getByRole('textbox',{name:'Campo de teste'});
 await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveAccessibleDescription('Campo obrigatório');
 await input.fill('Apenas teste local');await expect(input).toHaveAttribute('aria-invalid','false');
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(trigger).toBeFocused();
 await expect(page.getByLabel('Fechos')).toHaveText('1');await trigger.click();await page.getByRole('button',{name:'Fechar',exact:true}).click();
 await expect(page.getByLabel('Fechos')).toHaveText('2');await expect(trigger).toBeFocused();
});
