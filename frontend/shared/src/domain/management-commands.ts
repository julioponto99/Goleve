import { ApiError } from '../api/errors';
import { decodeMe } from '../auth/decoders';
import type { Runtime } from '../auth/runtime';
export type ManagementCommand={kind:'service';id:string;version:number;reasonCode:string;action:'suspend'|'reactivate'}|{kind:'case';id:string;version:number;reasonCode:string;status:'in_progress'|'resolved'|'closed'}|{kind:'create-case';serviceId:string;reasonCode:string};
export async function executeManagementCommand(runtime:Runtime,command:ManagementCommand){
 const id=command.kind==='create-case'?command.serviceId:command.id;
 if(!/^[a-f0-9]{24}$/.test(id)||!/^[a-z][a-z0-9_]{2,63}$/.test(command.reasonCode)||command.kind!=='create-case'&&(!Number.isSafeInteger(command.version)||command.version<1)||command.kind==='service'&&!['suspend','reactivate'].includes(command.action)||command.kind==='case'&&!['in_progress','resolved','closed'].includes(command.status))throw new ApiError(400,'VALIDATION_ERROR','not-started');
 const state=runtime.session.getSnapshot(),token=runtime.session.currentToken();if(state.status!=='authenticated'||state.user.userType!=='gestor'||!token)throw new ApiError(403,'MANAGER_REQUIRED','not-started');
 const identity=decodeMe((await runtime.api.request('get','/auth/me')).body);if(identity.id!==state.user.id||identity.userType!=='gestor'||identity.accountStatus!=='active'||runtime.session.currentToken()!==token)throw new ApiError(403,'PERMISSION_CHANGED','not-started');
 if(command.kind==='create-case')return runtime.api.request('post','/management/cases',{body:{serviceId:command.serviceId,caseType:'service_operation',resourceOwnerService:'professional',resourceId:command.serviceId,reasonCode:command.reasonCode}});
 const options={params:{id},headers:{'If-Match':`"${id}:${command.version}"`},body:{reasonCode:command.reasonCode}};
 if(command.kind==='case')return runtime.api.request('patch','/management/cases/{id}',{...options,body:{...options.body,status:command.status}});
 return command.action==='suspend'?runtime.api.request('post','/management/services/{id}/suspend',options):runtime.api.request('post','/management/services/{id}/reactivate',options);
}
