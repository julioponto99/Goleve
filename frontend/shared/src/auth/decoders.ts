import { ApiError } from '../api/errors';
import type { AuthResponse, PublicUser, Role } from '../contracts/domain';
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const roles:readonly Role[]=['utilizador','profissional','gestor','administrador'];
export function decodeAuthority(value:unknown):{authority?:'local-demo';demoInstanceId?:string}{
 if(!record(value))throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 if(value.authority===undefined||value.authority==='standard')return{};
 if(value.authority!=='local-demo'||typeof value.demoInstanceId!=='string'||!/^[a-f0-9]{16}$/.test(value.demoInstanceId))throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 return{authority:'local-demo',demoInstanceId:value.demoInstanceId};
}
export function decodeUser(value:unknown):PublicUser {
 if(!record(value)||typeof value.id!=='string'||!/^[a-f0-9]{24}$/i.test(value.id)||typeof value.name!=='string'||typeof value.email!=='string'||!roles.includes(value.userType as Role)
 ||!['active','suspended'].includes(String(value.accountStatus))||!Number.isSafeInteger(value.roleVersion)||Number(value.roleVersion)<0
 ||typeof value.createdAt!=='string'||typeof value.updatedAt!=='string')throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 // Explicit projection: never retain unknown server fields such as hashes or secrets.
 return {id:value.id,name:value.name,email:value.email,userType:value.userType as Role,accountStatus:value.accountStatus as 'active'|'suspended',roleVersion:Number(value.roleVersion),createdAt:value.createdAt,updatedAt:value.updatedAt};
}
export function decodeMe(value:unknown):PublicUser {
 if(!record(value)||!('user'in value))throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 return decodeUser(value.user);
}
export function decodeAuth(value:unknown):AuthResponse {
 if(!record(value)||!Number.isFinite(value.expiresIn)||Number(value.expiresIn)<=0)throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 if(value.mfaRequired===true){
  if(typeof value.challenge!=='string'||!value.challenge||typeof value.enrollmentRequired!=='boolean')throw new ApiError(502,'INVALID_AUTH_RESPONSE');
  return {challenge:value.challenge,mfaRequired:true,enrollmentRequired:value.enrollmentRequired,expiresIn:Number(value.expiresIn)};
 }
 if(typeof value.accessToken!=='string'||!value.accessToken||value.tokenType!=='Bearer')throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 return {user:decodeUser(value.user),accessToken:value.accessToken,tokenType:'Bearer',expiresIn:Number(value.expiresIn)};
}
export function decodeRecoveryCodes(value:unknown):readonly string[]{
 if(!record(value)||value.recoveryCodes===undefined)return [];
 if(!Array.isArray(value.recoveryCodes)||value.recoveryCodes.length!==10||!value.recoveryCodes.every(code=>typeof code==='string'&&/^[a-f0-9]{32}$/.test(code))||new Set(value.recoveryCodes).size!==10)throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 return [...value.recoveryCodes] as string[];
}
export function decodeEnrollment(value:unknown):{secret:string;otpauthUri:string}{
 const data=record(value)?value.data:undefined;
 if(!record(data)||typeof data.secret!=='string'||!data.secret.match(/^[A-Z2-7]{16,128}$/)||typeof data.otpauthUri!=='string')throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 let uri:URL;try{uri=new URL(data.otpauthUri);}catch{throw new ApiError(502,'INVALID_AUTH_RESPONSE');}
 if(uri.protocol!=='otpauth:'||uri.hostname!=='totp'||uri.searchParams.get('secret')!==data.secret||uri.searchParams.get('issuer')!=='GoLeve')throw new ApiError(502,'INVALID_AUTH_RESPONSE');
 return {secret:data.secret,otpauthUri:data.otpauthUri};
}
