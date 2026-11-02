import { test, expect } from '@playwright/test';
test.beforeEach(async({page,baseURL})=>{
 // Fail closed for every remote request. No traffic reaches the running backend.
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(baseURL!).origin)return route.continue();
  return route.abort('blockedbyclient');
 });
});
async function menuIfNeeded(page:import('@playwright/test').Page){
 const toggle=page.getByRole('button',{name:'Abrir menu'});if(await toggle.isVisible())await toggle.click();
}
test('initial shell has no fictional personal statistics and no credentials in storage',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/O teu ritmo/})).toBeVisible();
 await expect(page.getByText('98 kg',{exact:false})).toHaveCount(0);
 await expect(page.getByText('+100 pts',{exact:false})).toHaveCount(0);
 const storage=await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}));
 expect(storage).toEqual({local:[],session:[]});expect(errors).toEqual([]);
});
test('light/dark choice persists while navigating and private pages request a session',async({page})=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 await page.getByRole('button',{name:'Alterar tema'}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await menuIfNeeded(page);await page.getByRole('link',{name:'Treinos',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Sessão necessária'})).toBeVisible();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.goBack();await expect(page.getByRole('heading',{name:/O teu ritmo/})).toBeVisible();
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});
test('navigation cannot activate Coach or query private resources without a session',async({page})=>{
 const requests:string[]=[];page.on('request',request=>{if(request.url().startsWith('http://127.0.0.1:64344'))requests.push(request.url());});
 await page.goto('/coach');await expect(page.getByText('O Coach IA permanece desativado neste ambiente.')).toBeVisible();
 await expect(page.getByRole('heading',{name:'Sessão necessária'})).toBeVisible();expect(requests).toEqual([]);
});
test('the connection check displays only a verified HTTP result',async({page})=>{
 await page.route('http://127.0.0.1:64344/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({service:'api-gateway',status:'ok'})}));
 await page.goto('/');await page.getByRole('button',{name:'Verificar ligação'}).click();
 // Desktop header hides this status on small viewports; assert the underlying live region.
 await expect(page.locator('.connection')).toHaveText('Ligação verificada');
 await expect(page.getByText('Ligação verificada.',{exact:true})).toBeVisible();
});
test('a failed connection shows an explicit error instead of sample data',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Verificar ligação'}).click();
 await expect(page.getByRole('heading',{name:'Ligação indisponível'})).toBeVisible();
});
test('invalid frontend paths do not route to technical APIs',async({page})=>{
 await page.goto('/internal/v1/management');
 await expect(page.getByRole('heading',{name:'Página não encontrada',exact:true}).first()).toBeVisible();
 await expect(page.getByRole('button',{name:'Voltar ao início'})).toBeVisible();
});
test('all visible navigation assets resolve and layout stays inside the viewport',async({page})=>{
 await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 await menuIfNeeded(page);
 const result=await page.locator('img').evaluateAll(nodes=>nodes.map(n=>{
  if(!(n instanceof HTMLImageElement))throw new Error('Expected an image element');
  return {loaded:n.complete&&n.naturalWidth>0,width:n.width,height:n.height};
 }));
 expect(result.length).toBeGreaterThanOrEqual(7);expect(result.every(n=>n.loaded&&n.width>0&&n.height>0)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('responsive layout works in both themes without pretending to be a native device',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 for(const scheme of ['light','dark'] as const){
  await page.goto('/');if(await page.locator('html').getAttribute('data-theme')!==scheme)await page.getByRole('button',{name:'Alterar tema'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme',scheme);
  await page.screenshot({path:info.outputPath('shell-'+scheme+'.png'),fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('keyboard navigation respects the desktop layout and the mobile drawer',async({page},info)=>{
 await page.goto('/');
 if(info.project.name==='responsive-web'){
  const trigger=page.getByRole('button',{name:'Abrir menu'});await trigger.click();
  const brand=page.getByRole('link',{name:'GoLeve',exact:true});await expect(brand).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(page.getByRole('link',{name:'Perfil pessoal',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(brand).toBeFocused();
  await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(brand).toBeHidden();
 }else{
  await expect(page.getByRole('link',{name:'Treinos',exact:true})).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Saltar para o conteúdo'})).toBeFocused();
 }
});
test('the original GoLeve PNG and favicon follow the selected theme',async({page},info)=>{
 await page.emulateMedia({colorScheme:'light'});await page.goto('/');
 const brand=page.locator('.brand img:visible, .header-brand-icon:visible');
 await expect(brand).toHaveCount(1);await expect(brand).toHaveAttribute('src',/icone-lime-512/);
 await expect(page.locator('#app-favicon')).toHaveAttribute('href',/icone-lime-512/);
 await page.getByRole('button',{name:'Alterar tema'}).click();
 await expect(brand).toHaveAttribute('src',/icone-dark-512/);
 await expect(page.locator('#app-favicon')).toHaveAttribute('href',/icone-dark-512/);
 await expect.poll(()=>brand.evaluate(node=>node instanceof HTMLImageElement&&node.complete&&node.naturalWidth===512&&node.naturalHeight===512)).toBe(true);
 const size=await brand.boundingBox();expect(size?.width).toBe(info.project.name==='responsive-web'?32:42);expect(size?.height).toBe(size?.width);
});
