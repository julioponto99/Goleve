import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fakeRecoveryCodes, login, mockAuth, openSidebar } from './auth-fixture';
test.beforeEach(async({page,baseURL})=>{
 await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(baseURL!).origin?route.continue():route.abort('blockedbyclient'));
});
for(const role of ['utilizador','profissional','gestor','administrador'] as const)test('real client login and correct dashboard shell for '+role+' with isolated API responses',async({page},info)=>{
 const fake=await mockAuth(page,{role});await login(page);
 if(role==='administrador'){
  await expect(page).toHaveURL(/\/autenticacao\/mfa$/);expect(fake.requests.filter(row=>row.path==='/auth/me')).toHaveLength(0);
  await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();
 }
 await expect(page).toHaveURL(new RegExp('/painel/'+role+'$'));await expect(page.getByRole('heading',{name:'Olá, '+fake.user.name+'.',exact:true})).toBeVisible();
 if(role==='utilizador')await expect(page.getByRole('heading',{name:'O teu dia num relance'})).toBeVisible();else await expect(page.getByText('Dados fornecidos pelos serviços da tua conta.',{exact:false})).toBeVisible();
 expect(fake.requests.filter(row=>row.path==='/auth/me')).toHaveLength(1);
 expect(await page.evaluate(()=>({...localStorage}))).toEqual({});expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
 for(const theme of ['light','dark']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
  await page.screenshot({path:info.outputPath(role+'-'+theme+'.png'),fullPage:true});
 }
 const other=role==='administrador'?'gestor':'administrador';
 const previousRequests=fake.requests.length;
 await page.evaluate(path=>{history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));},'/painel/'+other);
 await expect(page.getByRole('heading',{name:'Acesso não autorizado',exact:true})).toBeVisible();
 expect(fake.requests.slice(previousRequests).some(row=>row.path.startsWith('/management')||row.path.startsWith('/professionals'))).toBe(false);
});
test('public registration sends only the permitted DTO and validates before making a request',async({page})=>{
 const fake=await mockAuth(page);await page.goto('/criar-conta');await page.getByRole('button',{name:'Criar conta',exact:true}).click();
 await expect(page.getByText('Indica um nome entre 2 e 100 caracteres, sem caracteres de controlo.')).toBeVisible();expect(fake.requests).toHaveLength(0);
 const passwordBox=await page.getByLabel('Palavra-passe',{exact:true}).boundingBox(),toggleBox=await page.getByRole('button',{name:'Mostrar palavra-passe',exact:true}).boundingBox();
 expect(Math.abs((passwordBox!.y+passwordBox!.height/2)-(toggleBox!.y+toggleBox!.height/2))).toBeLessThan(1);
 await page.getByLabel('Nome completo',{exact:true}).fill('Conta de teste');await page.getByLabel('E-mail',{exact:true}).fill(' WEB@EXAMPLE.INVALID ');
 await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByLabel('Confirmar palavra-passe',{exact:true}).fill('not-a-real-password');
 await page.getByRole('button',{name:'Criar conta',exact:true}).click();await expect(page).toHaveURL(/\/painel\/utilizador$/);
 expect(fake.requests[0]?.body).toEqual({name:'Conta de teste',email:'web@example.invalid',password:'not-a-real-password'});
 expect(fake.requests[0]?.bearer).toBeUndefined();
});
test('invalid credentials, duplicate email, rate limit and network errors never grant a session',async({page})=>{
 await page.route('http://127.0.0.1:64344/auth/login',route=>route.fulfill({status:401,contentType:'application/json',body:'{"error":{"code":"INVALID_CREDENTIALS","message":"do not echo this server secret"}}'}));
 await login(page);await expect(page.getByRole('alert')).toContainText('Email ou palavra-passe inválidos.');await expect(page.getByText('do not echo this server secret')).toHaveCount(0);
 await page.goto('/criar-conta');await page.getByLabel('Nome completo').fill('Conta de teste');await page.getByLabel('E-mail',{exact:true}).fill('web@example.invalid');await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByLabel('Confirmar palavra-passe',{exact:true}).fill('not-a-real-password');
 await page.route('http://127.0.0.1:64344/auth/register',route=>route.fulfill({status:409,contentType:'application/json',body:'{"error":{"code":"EMAIL_ALREADY_EXISTS"}}'}));
 await page.getByRole('button',{name:'Criar conta',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Não foi possível criar a conta com este email');
 await page.route('http://127.0.0.1:64344/auth/login',route=>route.fulfill({status:429,contentType:'application/json',body:'{}',headers:{'Retry-After':'60'}}));await login(page);await expect(page.getByRole('alert')).toContainText('Demasiadas tentativas');
 await page.route('http://127.0.0.1:64344/auth/login',route=>route.abort());await login(page);await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar o resultado');
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test('a deep protected URL is restored only after a valid session and session list can revoke local access',async({page})=>{
 const fake=await mockAuth(page);await page.goto('/conta/seguranca');await expect(page).toHaveURL(/\/entrar$/);
 await page.getByLabel('E-mail',{exact:true}).fill('web@example.invalid');await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByRole('button',{name:'Iniciar sessão',exact:true}).click();
 await expect(page).toHaveURL(/\/conta\/seguranca$/);await expect(page.getByText('Sessão atual',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Terminar sessão atual',exact:true}).click();await expect(page).toHaveURL(/\/entrar$/);
 expect(fake.requests.some(row=>row.path==='/auth/logout'&&row.bearer==='Bearer synthetic-browser-session')).toBe(true);
 await expect(page.getByText('Sessão atual',{exact:true})).toHaveCount(0);
});
test('reload requires a new login rather than reading a token from browser storage',async({page})=>{
 await mockAuth(page);await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);await page.reload();
 await expect(page).toHaveURL(/\/entrar$/);expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test('a revoked session clears private content and a 403 stays an explicit denial rather than an empty list',async({page})=>{
 const fake=await mockAuth(page);await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);
 await openSidebar(page);await page.getByRole('link',{name:'Segurança',exact:true}).click();await expect(page.getByText('Sessão atual',{exact:true})).toBeVisible();
 fake.state.denySessions=true;await page.getByRole('button',{name:'Atualizar sessões',exact:true}).click();await expect(page.getByRole('heading',{name:'Consulta não autorizada'})).toBeVisible();await expect(page.getByText('Sessão atual',{exact:true})).toHaveCount(0);
 fake.state.revoked=true;await page.getByRole('button',{name:'Atualizar sessões',exact:true}).click();await expect(page).toHaveURL(/\/entrar$/);
});
test('MFA rejects an incorrect factor and supports a single recovery factor without persisting it',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador'});await login(page);
 await page.getByLabel('Código da aplicação',{exact:true}).fill('000000');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();await expect(page.getByRole('alert')).toContainText('O código é inválido');
 await page.getByRole('button',{name:'Usar código de recuperação',exact:true}).click();await page.getByLabel('Código de recuperação',{exact:true}).fill('f'.repeat(32));await page.getByRole('button',{name:'Confirmar segundo fator'}).click();await expect(page).toHaveURL(/\/painel\/administrador$/);
 const submitted=fake.requests.filter(row=>row.path==='/auth/mfa/complete').at(-1)!;expect(submitted.body).toEqual({challenge:'c'.repeat(64),recoveryCode:'f'.repeat(32)});
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test('administrative enrollment requires password, real completion and recovery acknowledgment',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador',enroll:true});await login(page);
 await expect(page.getByRole('heading',{name:'Configurar autenticação de dois fatores'})).toBeVisible();
 await page.getByLabel('Confirma a palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByRole('button',{name:'Preparar TOTP'}).click();
 await expect(page.getByRole('heading',{name:'Configuração manual'})).toBeVisible();await expect(page.getByText('A'.repeat(32),{exact:true})).toBeVisible();
 await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();
 await expect(page.getByRole('heading',{name:'Guarda os códigos de recuperação'})).toBeVisible();await expect(page.getByRole('button',{name:'Continuar para o painel'})).toBeDisabled();
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);
 await page.getByRole('checkbox',{name:'Guardei os códigos em segurança'}).check();await page.getByRole('button',{name:'Continuar para o painel'}).click();await expect(page).toHaveURL(/\/painel\/administrador$/);
 await expect(page.getByText(fakeRecoveryCodes[0]!,{exact:true})).toHaveCount(0);await expect(page.getByText('A'.repeat(32),{exact:true})).toHaveCount(0);
 expect(fake.requests.some(row=>row.path==='/auth/mfa/enroll')).toBe(true);
});
test('session and challenge expiry deny access and do not create a refresh or password reset call',async({page})=>{
 await page.clock.install();const fake=await mockAuth(page,{role:'administrador'});await login(page);await expect(page).toHaveURL(/\/autenticacao\/mfa$/);
 await page.clock.fastForward(600001);await expect(page.getByRole('heading',{name:'Verificação indisponível'})).toBeVisible();
 await page.getByRole('button',{name:'Voltar ao login'}).click();await expect(page.getByText('A recuperação de palavra-passe ainda não está disponível.')).toBeVisible();
 expect(fake.requests.some(row=>/refresh|reset|recover/.test(row.path))).toBe(false);
});
test('authentication layout remains usable with keyboard in Light/Dark on narrow screens',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/entrar');
 for(const theme of ['light','dark']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Alterar tema'}).click();
  for(const width of [320,402,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.getByRole('button',{name:'Iniciar sessão',exact:true})).toBeVisible();}
  await page.screenshot({path:info.outputPath('login-'+theme+'.png'),fullPage:true});
 }
 await page.getByLabel('E-mail',{exact:true}).focus();await page.keyboard.press('Tab');await expect(page.getByLabel('Palavra-passe',{exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.getByLabel('E-mail',{exact:true})).toBeFocused();
 await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByRole('button',{name:'Mostrar palavra-passe',exact:true}).click();await expect(page.getByLabel('Palavra-passe',{exact:true})).toHaveAttribute('type','text');
 await page.getByRole('button',{name:'Ocultar palavra-passe',exact:true}).click();await expect(page.getByLabel('Palavra-passe',{exact:true})).toHaveAttribute('type','password');expect(errors).toEqual([]);
});
test('leaving an in-flight login cancels local authorization and late responses cannot redirect',async({page})=>{
 const fake=await mockAuth(page);let release!:()=>void;
 await page.route('http://127.0.0.1:64344/auth/login',async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({contentType:'application/json',body:JSON.stringify({user:fake.user,accessToken:'synthetic-browser-session',tokenType:'Bearer',expiresIn:3600})});});
 await login(page);await expect(page.getByRole('status')).toContainText('A verificar a identidade');await expect.poll(()=>typeof release).toBe('function');
 await page.getByRole('button',{name:'Voltar ao início',exact:true}).click();release();
 await expect(page).toHaveURL(/\/entrar$/);await expect(page.getByRole('heading',{name:'Olá, bem-vindo de volta!'})).toBeVisible();
 expect(fake.requests.filter(row=>row.path==='/auth/me')).toHaveLength(0);
 await page.evaluate(()=>{history.pushState(null,'','/painel/utilizador');dispatchEvent(new PopStateEvent('popstate'));});await expect(page).toHaveURL(/\/entrar$/);
});
test('dependency failure blocks access and explicit revalidation restores the real current identity response',async({page})=>{
 const fake=await mockAuth(page);await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);await openSidebar(page);await page.getByRole('link',{name:'Segurança',exact:true}).click();await expect(page.getByText('Sessão atual',{exact:true})).toBeVisible();
 fake.state.meUnavailable=true;await page.getByRole('button',{name:'Verificar sessão atual'}).click();await expect(page.getByRole('heading',{name:'Sessão por verificar'})).toBeVisible();
 fake.state.meUnavailable=false;await page.getByRole('button',{name:'Verificar sessão',exact:true}).click();await expect(page.getByText('Sessão atual',{exact:true})).toBeVisible();
});
test('the scoped step-up dialog invokes its exact operation once and never displays the proof',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador'}),fixture=path.resolve('tests/fixtures/stepup-harness.tsx').replaceAll('\\','/');
 await page.route('**/__test/step-up',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="pt"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${fixture}"></script></body></html>`}));
 await page.goto('/__test/step-up');await page.getByRole('button',{name:'Preparar operação de teste'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar esta operação',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('status')).toContainText('Resposta de teste recebida');
 const proof=fake.requests.find(row=>row.path==='/auth/admin/step-up');expect(proof?.body?.action).toBe('user.revoke');expect(proof?.body?.targetId).toBe('b'.repeat(24));
 expect(fake.requests.filter(row=>row.path.endsWith('/revoke'))).toHaveLength(1);await expect(page.getByText('d'.repeat(64),{exact:false})).toHaveCount(0);expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test('the active session expires and private content disappears without silently refreshing it',async({page})=>{
 await page.clock.install();const fake=await mockAuth(page,{expiresIn:60});await login(page);await expect(page).toHaveURL(/\/painel\/utilizador$/);
 await page.clock.fastForward(60001);await expect(page).toHaveURL(/\/entrar$/);await expect(page.getByRole('heading',{name:'Olá, '+fake.user.name+'.',exact:true})).toHaveCount(0);
 expect(fake.requests.filter(row=>row.path==='/auth/login')).toHaveLength(1);
});
test('leaving an in-flight MFA completion drops the late session instead of redirecting',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador'});let release!:()=>void;
 await page.route('http://127.0.0.1:64344/auth/mfa/complete',async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({contentType:'application/json',body:JSON.stringify({user:fake.user,accessToken:'synthetic-browser-session',tokenType:'Bearer',expiresIn:3600})});});
 await login(page);await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar segundo fator'}).click();await expect.poll(()=>typeof release).toBe('function');
 await page.getByRole('button',{name:'Voltar ao início',exact:true}).click();release();await expect(page).toHaveURL(/\/entrar$/);
 await page.evaluate(()=>{history.pushState(null,'','/painel/administrador');dispatchEvent(new PopStateEvent('popstate'));});await expect(page).toHaveURL(/\/entrar$/);expect(fake.requests.filter(row=>row.path==='/auth/me')).toHaveLength(0);
});
test('an uncertain step-up write stays blocked when the same intent is reopened',async({page})=>{
 const fake=await mockAuth(page,{role:'administrador'}),fixture=path.resolve('tests/fixtures/stepup-harness.tsx').replaceAll('\\','/');let mutations=0;
 await page.route('http://127.0.0.1:64344/auth/administration/users/'+'b'.repeat(24)+'/revoke',route=>{mutations++;return route.abort();});
 await page.route('**/__test/uncertain-step-up',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="pt"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${fixture}"></script></body></html>`}));
 await page.goto('/__test/uncertain-step-up');await page.getByRole('button',{name:'Preparar operação de teste'}).click();
 await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByLabel('Código da aplicação',{exact:true}).fill('123456');await page.getByRole('button',{name:'Confirmar esta operação'}).click();
 await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar o resultado');await expect(page.getByRole('button',{name:'Confirmar esta operação'})).toBeDisabled();
 await page.getByRole('button',{name:'Fechar',exact:true}).click();await page.getByRole('button',{name:'Preparar operação de teste'}).click();
 await expect(page.getByRole('button',{name:'Confirmar esta operação'})).toBeDisabled();expect(mutations).toBe(1);expect(fake.requests.filter(row=>row.path==='/auth/admin/step-up')).toHaveLength(1);
});
