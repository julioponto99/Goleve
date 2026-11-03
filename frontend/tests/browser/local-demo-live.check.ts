import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const enabled=process.env.GOLEVE_REAL_DEMO_ACK==='approved-five-fixtures';
test.skip(!enabled,'Explicit authorization acknowledgment required for real local-demo HTTP');
const manifest=enabled?JSON.parse(fs.readFileSync(path.resolve('../.secrets/local-runtime/demo-identities.json'),'utf8')):null;
const credentials: {email:string;password:string}[]=enabled?require('../../../scripts/local-demo.cjs').decryptCredentials():[];
for(let i=0;i<5;i++)test('real login, protected dashboard and logout / fixture '+i,async({page},info)=>{
 const account=manifest.accounts[i],credential=credentials.find(a=>a.email===account.email)!;
 await page.goto('/entrar');await page.getByLabel('E-mail',{exact:true}).fill(account.email);await page.getByLabel('Palavra-passe',{exact:true}).fill(credential.password);await page.getByRole('button',{name:'Iniciar sessão',exact:true}).click();
 await expect(page).toHaveURL('/painel/'+account.role);await expect(page.locator('.sidebar-footer')).toContainText(account.name);
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByLabel('Código da aplicação',{exact:true})).toHaveCount(0);
 if(i===0){await expect(page.getByRole('heading',{name:'Olá, '+account.name+'.',exact:true})).toBeVisible();await expect(page.getByText('Hidratação indisponível',{exact:true})).toHaveCount(0);await expect(page.getByText('1,2 L',{exact:true})).toBeVisible();}
 // Use SPA navigation: the approved Web design deliberately keeps tokens only in memory.
 if(i===3){await page.getByRole('link',{name:'Serviços sob gestão',exact:true}).click();await expect(page).toHaveURL('/gestao/servicos');await expect(page.getByText('Treino pessoal — demonstração',{exact:false}).first()).toBeVisible();}
 if(i===4){await page.getByRole('link',{name:'Utilizadores e papéis',exact:true}).click();await expect(page).toHaveURL('/administracao/utilizadores');await expect(page.getByText('utilizador@demo.goleve.test',{exact:false}).first()).toBeVisible();await expect(page.getByRole('heading',{name:'Utilizadores e papéis',exact:true}).first()).toBeVisible();}
 // Captures only authenticated synthetic data; traces and request/response recording are disabled.
 await page.screenshot({path:info.outputPath('fixture-'+i+'.png'),fullPage:true});
 await page.getByRole('button',{name:'Terminar sessão',exact:true}).click();await expect(page).toHaveURL('/entrar');
 const secretStorage=await page.evaluate(()=>Object.keys(localStorage).filter(k=>/token|password|credential/i.test(k)));expect(secretStorage).toEqual([]);
});
