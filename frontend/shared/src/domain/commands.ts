import { ApiError } from '../api/errors';
import { decodeMe } from '../auth/decoders';
import type { Runtime } from '../auth/runtime';
import { record } from './resources';
export type PersonalCommand=
 | {kind:'intake';amountMl:number;timezone:string;idempotencyKey:string}
 | {kind:'hydration-goal';targetMl:number;timezone:string}
 | {kind:'measurement';measurementKind:'weight'|'height'|'waist'|'hip'|'chest'|'arm'|'thigh'|'other';value:number;timezone:string;idempotencyKey:string}
 | {kind:'plan';title:string;environment:'home'|'gym'|'outdoor'}
 | {kind:'session';planId?:string}
 | {kind:'training-transition';id:string;action:'start'|'pause'|'resume'|'complete'|'cancel'}
 | {kind:'activity';title:string;activityKind:'personal'|'workout';environment?:'home'|'gym'|'outdoor';startAt:string;endAt:string;timezone:string;status:'planned'|'completed'}
 | {kind:'activity-transition';id:string;action:'complete'|'cancel'}
 | {kind:'profile';displayName:string};
const validId=(value:string)=>/^[a-f0-9]{24}$/.test(value);
const integer=(value:number,min:number,max:number)=>Number.isInteger(value)&&value>=min&&value<=max;
function validate(command:PersonalCommand){
 const invalid=()=>{throw new ApiError(400,'VALIDATION_ERROR','not-started');};
 if('timezone'in command)try{if(command.timezone.length>64)invalid();new Intl.DateTimeFormat('en-US',{timeZone:command.timezone}).format();}catch{invalid();}
 if('idempotencyKey'in command&&!/^[a-zA-Z0-9-]{8,128}$/.test(command.idempotencyKey))invalid();
 if(command.kind==='intake'&&!integer(command.amountMl,1,10000))invalid();
 if(command.kind==='hydration-goal'&&!integer(command.targetMl,250,20000))invalid();
 if(command.kind==='measurement'&&(!['weight','height','waist','hip','chest','arm','thigh','other'].includes(command.measurementKind)||!Number.isFinite(command.value)||command.value<.01||command.value>1000))invalid();
 if(command.kind==='plan'&&(!command.title.trim()||command.title.length>160||!['home','gym','outdoor'].includes(command.environment)))invalid();
 if(command.kind==='session'&&command.planId&&!validId(command.planId))invalid();
 if(command.kind==='profile'&&(command.displayName.trim().length<2||command.displayName.length>100||/[\u0000-\u001f\u007f]/.test(command.displayName)))invalid();
 if(command.kind==='training-transition'&&(!validId(command.id)||!['start','pause','resume','complete','cancel'].includes(command.action)))invalid();
 if(command.kind==='activity-transition'&&(!validId(command.id)||!['complete','cancel'].includes(command.action)))invalid();
 if(command.kind==='activity'){
  const start=Date.parse(command.startAt),end=Date.parse(command.endAt);
  if(!command.title.trim()||command.title.length>160||!['personal','workout'].includes(command.activityKind)||!['planned','completed'].includes(command.status)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||command.activityKind==='workout'&&!['home','gym','outdoor'].includes(command.environment??'')||command.activityKind==='personal'&&command.environment!==undefined)invalid();
 }
}
// No background work, arbitrary commands, third-party accounts or automatic retries.
export async function executePersonalCommand(runtime:Runtime,command:PersonalCommand){
 validate(command);const session=runtime.session.getSnapshot(),token=runtime.session.currentToken();
 if(session.status!=='authenticated'||!token||command.kind!=='profile'&&session.user.userType!=='utilizador')throw new ApiError(403,'FORBIDDEN','not-started');
 const identity=decodeMe((await runtime.api.request('get','/auth/me')).body);
 const guard=()=>{if(identity.id!==session.user.id||identity.accountStatus!=='active'||identity.userType!==session.user.userType||runtime.session.currentToken()!==token)throw new ApiError(403,'PERMISSION_CHANGED','not-started');};guard();
 let response;
 if(command.kind==='intake')response=await runtime.api.request('post','/hydration/intakes',{body:{amountMl:command.amountMl,timezone:command.timezone,idempotencyKey:command.idempotencyKey}});
 else if(command.kind==='measurement')response=await runtime.api.request('post','/performance/measurements',{body:{kind:command.measurementKind,value:command.value,unit:command.measurementKind==='weight'?'kg':'cm',timezone:command.timezone,idempotencyKey:command.idempotencyKey}});
 else if(command.kind==='hydration-goal'){
  let version:number|undefined;
  try{const result=await runtime.api.request('get','/hydration/goal'),data=record(result.body)?result.body.data:undefined;if(!record(data)||!Number.isInteger(data.version)||Number(data.version)<1)throw new ApiError(502,'INVALID_RESPONSE');version=Number(data.version);}catch(error){if(!(error instanceof ApiError&&error.status===404&&error.code==='GOAL_NOT_FOUND'))throw error;}
  guard();response=await runtime.api.request('put','/hydration/goal',{body:{targetMl:command.targetMl,timezone:command.timezone,...(version?{version}:{})}});
 }else if(command.kind==='plan')response=await runtime.api.request('post','/training/plans',{body:{title:command.title.trim(),environment:command.environment,exercises:[],goals:[],days:[]}});
 else if(command.kind==='session')response=await runtime.api.request('post','/training/sessions',{body:command.planId?{planId:command.planId}:{}});
 else if(command.kind==='training-transition'){
  const options={params:{sessionId:command.id},body:{}};
  if(command.action==='start')response=await runtime.api.request('post','/training/sessions/{sessionId}/start',options);
  else if(command.action==='pause')response=await runtime.api.request('post','/training/sessions/{sessionId}/pause',options);
  else if(command.action==='resume')response=await runtime.api.request('post','/training/sessions/{sessionId}/resume',options);
  else if(command.action==='complete')response=await runtime.api.request('post','/training/sessions/{sessionId}/complete',options);
  else response=await runtime.api.request('post','/training/sessions/{sessionId}/cancel',options);
 }else if(command.kind==='activity')response=await runtime.api.request('post','/agenda/activities',{body:{title:command.title.trim(),kind:command.activityKind,startAt:command.startAt,endAt:command.endAt,timezone:command.timezone,status:command.status,...(command.environment?{environment:command.environment}:{})}});
 else if(command.kind==='activity-transition')response=command.action==='complete'?await runtime.api.request('post','/agenda/activities/{activityId}/complete',{params:{activityId:command.id},body:{}}):await runtime.api.request('post','/agenda/activities/{activityId}/cancel',{params:{activityId:command.id},body:{}});
 else{
  let etag:string|undefined,create=false;
  try{const current=await runtime.api.request('get','/users/me');if(!current.etag)throw new ApiError(502,'INVALID_RESPONSE');etag=current.etag;}catch(error){if(error instanceof ApiError&&error.status===404)create=true;else throw error;}
  guard();response=create?await runtime.api.request('put','/users/me',{body:{displayName:command.displayName.trim()},headers:{'If-None-Match':'*'}}):await runtime.api.request('patch','/users/me',{body:{displayName:command.displayName.trim()},headers:{'If-Match':etag!}});
 }
 guard();const data=record(response.body)?response.body.data:undefined;
 return {overlapWarning:record(data)&&data.overlapWarning===true};
}
