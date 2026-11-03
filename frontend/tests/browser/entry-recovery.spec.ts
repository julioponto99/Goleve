import { test, expect } from '@playwright/test';
import { login, mockAuth, openSidebar } from './auth-fixture';
test.beforeEach(async({page,baseURL})=>{await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort('blockedbyclient'));});
test('startup checks the session then opens login without persistent Web credentials',async({page})=>{
 await page.goto('/');await expect(page).toHaveURL(/\/entrar$/);await expect(page.getByLabel('E-mail',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>[Object.keys(localStorage),Object.keys(sessionStorage)])).toEqual([[],[]]);
});
test('recovery never claims email delivery or a reset and scrubs accidental token URLs',async({page},info)=>{
 const requests:string[]=[];page.on('request',request=>{if(request.url().startsWith('http://127.0.0.1:64344'))requests.push(request.url());});
 await page.goto('/entrar');await page.getByRole('link',{name:'Esqueceste-te da palavra-passe?'}).click();await expect(page.getByRole('heading',{name:'Recuperar acesso',exact:true})).toBeVisible();
 await page.getByLabel('E-mail').fill('unknown@example.invalid');await expect(page.getByRole('button',{name:'Enviar instruções'})).toBeDisabled();await expect(page.getByText('Não foram enviadas instruções',{exact:false})).toBeVisible();
 await page.screenshot({path:info.outputPath('recovery-light.png'),fullPage:true});await page.getByRole('button',{name:'Alterar tema'}).click();await page.screenshot({path:info.outputPath('recovery-dark.png'),fullPage:true});
 await page.goto('/recuperar-acesso/nova-palavra-passe#token=not-a-real-token');await expect(page).toHaveURL(/\/nova-palavra-passe$/);await expect(page.getByRole('button',{name:'Alterar palavra-passe'})).toBeDisabled();
 await page.getByRole('button',{name:'Mostrar nova palavra-passe'}).click();await expect(page.getByLabel('Nova palavra-passe',{exact:true})).toHaveAttribute('type','text');
 await page.goto('/recuperar-acesso/resultado');await expect(page.getByRole('heading',{name:'Recuperação indisponível'})).toBeVisible();await expect(page.getByText('Recuperação concluída',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Voltar ao Login'}).click();await expect(page).toHaveURL(/\/entrar$/);expect(requests).toEqual([]);
});
test('logout reaches login immediately even while server revocation is pending',async({page})=>{
 await mockAuth(page);await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);let release!:()=>void;
 await page.route('http://127.0.0.1:64344/auth/logout',async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:204});});
 await openSidebar(page);await page.getByRole('button',{name:'Terminar sessão',exact:true}).click();await expect(page).toHaveURL(/\/entrar$/);await expect(page.getByLabel('E-mail',{exact:true})).toBeVisible();
 await expect.poll(()=>typeof release).toBe('function');release();
});
test('hamburger has three lines and responds to close, navigate and Escape',async({page},info)=>{
 await mockAuth(page);await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);const toggle=page.getByRole('button',{name:'Abrir menu'});
 await expect(toggle.locator('.hamburger>span')).toHaveCount(3);await openSidebar(page);await page.getByRole('link',{name:'Segurança'}).click();await expect(page).toHaveURL(/\/conta\/seguranca$/);
 if(info.project.name==='responsive-web'){await expect(toggle).toHaveAttribute('aria-expanded','false');await toggle.click();await page.keyboard.press('Escape');await expect(toggle).toBeFocused();}else{await toggle.click();await expect(page.locator('.app-shell')).toHaveAttribute('data-sidebar','collapsed');expect((await page.locator('.sidebar').boundingBox())?.width).toBe(80);await toggle.click();expect((await page.locator('.sidebar').boundingBox())?.width).toBe(240);}
});
