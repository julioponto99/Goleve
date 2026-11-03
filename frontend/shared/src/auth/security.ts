import { ApiError } from '../api/errors';
import { decodeMe, decodeAuthority } from './decoders';
import { factorValid } from './validation';
import type { AuthAdminAction } from '../contracts/auth-security';
import type { MfaFactor } from './validation';
import type { Role } from '../contracts/domain';
import type { Runtime } from './runtime';
export interface CurrentSession{id:string;current:boolean;createdAt:string;expiresAt:string;mfa:boolean}
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
export function decodeSessions(value:unknown):CurrentSession[]{
 const data=record(value)?value.data:undefined,items=record(data)?data.items:undefined;
 if(!Array.isArray(items)||items.length>100)throw new ApiError(502,'INVALID_RESPONSE');
 return items.map(item=>{
  if(!record(item)||typeof item.id!=='string'||!/^[a-f0-9]{64}$/.test(item.id)||typeof item.current!=='boolean'||typeof item.mfa!=='boolean'||typeof item.createdAt!=='string'||typeof item.expiresAt!=='string'||!Number.isFinite(Date.parse(item.createdAt))||!Number.isFinite(Date.parse(item.expiresAt)))throw new ApiError(502,'INVALID_RESPONSE');
  return {id:item.id,current:item.current,mfa:item.mfa,createdAt:item.createdAt,expiresAt:item.expiresAt};
 });
}
const actions={'user.suspend':'suspend','user.reactivate':'reactivate','user.revoke':'revoke','role.request':'role-requests','role.approve':'approve','role.reject':'reject'} as const;
export interface AuthAdminIntent{readonly action:AuthAdminAction;readonly targetId:string;readonly parameters:Readonly<{version:number;reasonCode:string;newRole?:Role}>}
export function authAdminIntent(action:AuthAdminAction,targetId:string,parameters:AuthAdminIntent['parameters']):AuthAdminIntent{
 if(!Object.hasOwn(actions,action)||!/^[a-f0-9]{24}$/.test(targetId)||!Number.isInteger(parameters.version)||parameters.version<1||!/^([a-z][a-z0-9_]{2,63})$/.test(parameters.reasonCode)||Object.keys(parameters).some(key=>!['version','reasonCode','newRole'].includes(key)))throw new ApiError(400,'VALIDATION_ERROR','not-started');
 if(action==='role.request'?!['utilizador','profissional','gestor','administrador'].includes(parameters.newRole??''):parameters.newRole!==undefined)throw new ApiError(400,'VALIDATION_ERROR','not-started');
 return Object.freeze({action,targetId,parameters:Object.freeze({...parameters})});
}
export type StepUpCredentials={password:string}&(MfaFactor|{otp?:never;recoveryCode?:never});
const uncertainOperations=new WeakMap<Runtime,Set<string>>();
export async function authorizeAuthMutation(runtime:Runtime,input:AuthAdminIntent,credentials:StepUpCredentials,signal?:AbortSignal){
 const intent=authAdminIntent(input.action,input.targetId,input.parameters),state=runtime.session.getSnapshot(),token=runtime.session.currentToken();
 if(state.status!=='authenticated'||state.user.userType!=='administrador'||!token)throw new ApiError(403,'ADMIN_MFA_REQUIRED','not-started');
 const operationKey=state.user.id+':'+intent.action+':'+intent.targetId+':'+intent.parameters.version;
 if(uncertainOperations.get(runtime)?.has(operationKey))throw new ApiError(409,'RECONCILIATION_REQUIRED','not-started');
 if(!credentials.password||state.authority!=='local-demo'&&!factorValid(credentials))throw new ApiError(400,'VALIDATION_ERROR','not-started');
 const me=(await runtime.api.request('get','/auth/me',{...(signal?{signal}:{})})).body,identity=decodeMe(me),authority=decodeAuthority(me);
 if(identity.id!==state.user.id||identity.userType!=='administrador'||identity.accountStatus!=='active'||runtime.session.currentToken()!==token)throw new ApiError(403,'PERMISSION_CHANGED','not-started');
 if(authority.authority!==state.authority||authority.demoInstanceId!==state.demoInstanceId)throw new ApiError(403,'PERMISSION_CHANGED','not-started');
 if(authority.authority==='local-demo'?(credentials.otp!==undefined||credentials.recoveryCode!==undefined):!factorValid(credentials))throw new ApiError(400,'VALIDATION_ERROR','not-started');
 const factor=authority.authority==='local-demo'?{}:credentials.otp!==undefined?{otp:credentials.otp}:{recoveryCode:credentials.recoveryCode!};
 const response=await runtime.api.request('post','/auth/admin/step-up',{body:{password:credentials.password,...factor,action:intent.action,targetId:intent.targetId,parameters:intent.parameters},...(signal?{signal}:{})});
 const data=record(response.body)?response.body.data:undefined;
 if(!record(data)||typeof data.stepUpToken!=='string'||!/^[a-f0-9]{64}$/.test(data.stepUpToken)||!Number.isInteger(data.expiresIn)||Number(data.expiresIn)<1||Number(data.expiresIn)>300)throw new ApiError(502,'INVALID_RESPONSE');
 let proof:string|undefined=data.stepUpToken,used=false;
 const expiresAt=Date.now()+Number(data.expiresIn)*1000;
 return {expiresAt,async run(){
  if(used||!proof)throw new ApiError(403,'STEP_UP_CONSUMED','not-started');
  used=true;const header=proof;proof=undefined;
  if(signal?.aborted||Date.now()>=expiresAt||runtime.session.currentToken()!==token)throw new ApiError(403,'STEP_UP_INVALID','not-started');
  const options={params:{id:intent.targetId},body:intent.parameters,headers:{'X-Admin-Step-Up':header},...(signal?{signal}:{})} as const;
  const execute=async()=>{
  // Closed paths only. No arbitrary URL, method, headers, action or JSON command.
  if(intent.action==='role.request')return runtime.api.request('post','/auth/administration/users/{id}/role-requests',{...options,body:{...intent.parameters,newRole:intent.parameters.newRole!}});
  if(intent.action==='role.approve')return runtime.api.request('post','/auth/administration/role-requests/{id}/approve',options);
  if(intent.action==='role.reject')return runtime.api.request('post','/auth/administration/role-requests/{id}/reject',options);
  if(intent.action==='user.suspend')return runtime.api.request('post','/auth/administration/users/{id}/suspend',options);
  if(intent.action==='user.reactivate')return runtime.api.request('post','/auth/administration/users/{id}/reactivate',options);
  return runtime.api.request('post','/auth/administration/users/{id}/revoke',options);
  };
  try{return await execute();}catch(error){if(error instanceof ApiError&&error.outcome==='unknown'){const blocked=uncertainOperations.get(runtime)??new Set<string>();blocked.add(operationKey);uncertainOperations.set(runtime,blocked);}throw error;}
 }};
}
