import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { resources } from '../../shared/src/index';
import type { Role } from '../../shared/src/index';
export const testUser=(role:Role)=>({id:'a'.repeat(24),name:'Conta de teste '+role,email:'web@example.invalid',userType:role,accountStatus:'active',roleVersion:1,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z'});
export const fakeRecoveryCodes=Array.from({length:10},(_,n)=>n.toString(16).padStart(32,'0'));
export async function mockAuth(page:Page,options:{role?:Role;enroll?:boolean;expiresIn?:number}={}){
 const role=options.role??'utilizador',user=testUser(role),requests:{path:string;method:string;body:Record<string,unknown>|null;bearer:string|undefined}[]=[];
 const state={issued:false,revoked:false,denySessions:false,meUnavailable:false};
 await page.route('http://127.0.0.1:64344/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname,body=request.method()==='POST'?request.postDataJSON() as Record<string,unknown>:null;
  requests.push({path,method:request.method(),body,bearer:request.headers().authorization});
  const send=(data:unknown,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  const session=()=>({user,accessToken:'synthetic-browser-session',tokenType:'Bearer',expiresIn:options.expiresIn??3600});
  if(path==='/auth/login'||path==='/auth/register'){
   if(path==='/auth/login'&&role==='administrador')return send({challenge:'c'.repeat(64),mfaRequired:true,enrollmentRequired:options.enroll??false,expiresIn:600});
   state.issued=true;return send(session(),path.endsWith('/register')?201:200);
  }
  if(path==='/auth/mfa/enroll'){
   expect(body?.challenge).toBe('c'.repeat(64));expect(request.headers().authorization).toBeUndefined();
   return send({data:{secret:'A'.repeat(32),otpauthUri:'otpauth://totp/GoLeve?secret='+'A'.repeat(32)+'&issuer=GoLeve'}});
  }
  if(path==='/auth/mfa/complete'){
   expect(body?.challenge).toBe('c'.repeat(64));expect(request.headers().authorization).toBeUndefined();
   if(body?.otp!=='123456'&&body?.recoveryCode!=='f'.repeat(32))return send({error:{code:'INVALID_MFA'}},401);
   state.issued=true;return send({...session(),...(options.enroll?{recoveryCodes:fakeRecoveryCodes}:{})});
  }
  if(!state.issued||state.revoked||request.headers().authorization!=='Bearer synthetic-browser-session')return send({error:{code:'INVALID_TOKEN'}},401);
  if(path==='/auth/me')return state.meUnavailable?send({error:{code:'AUTH_UNAVAILABLE'}},503):send({user});
  if(path==='/auth/logout'){state.revoked=true;return route.fulfill({status:204});}
  if(path==='/auth/sessions')return state.denySessions?send({error:{code:'FORBIDDEN'}},403):send({data:{items:[{id:'1'.repeat(64),current:true,mfa:role==='administrador',createdAt:'2026-01-01T00:00:00.000Z',expiresAt:'2027-01-01T00:00:00.000Z'}]}});
  if(path==='/auth/admin/step-up')return send({data:{stepUpToken:'d'.repeat(64),expiresIn:300}},201);
  if(path==='/auth/administration/users/'+'b'.repeat(24)+'/revoke')return send({data:{id:'b'.repeat(24),status:'revoked'}});
  const def=Object.values(resources).find(item=>item.path===path);
  if(def&&request.method()==='GET')return send({data:def.shape==='single'?{}:def.shape==='metrics'?{sources:[]}:def.shape==='measurements'?{latestMeasurements:[]}:def.shape==='assignments'?{assignments:{items:[],nextBefore:null}}:{items:[],page:1,totalPages:0,nextBefore:null}});
  return send({error:{code:'UNEXPECTED_TEST_OPERATION'}},404);
 });
 return {requests,state,user};
}
export async function login(page:Page){
 await page.goto('/entrar');await page.getByLabel('E-mail',{exact:true}).fill('web@example.invalid');await page.getByLabel('Palavra-passe',{exact:true}).fill('not-a-real-password');await page.getByRole('button',{name:'Iniciar sessão',exact:true}).click();
}
export async function openSidebar(page:Page){const toggle=page.getByRole('button',{name:'Abrir menu'});await expect(toggle).toBeVisible();if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();}
export async function readyUser(page:Page){const fake=await mockAuth(page);await login(page);await expect(page.getByRole('heading',{name:'Olá, '+fake.user.name+'.',exact:true})).toBeVisible();return fake;}
