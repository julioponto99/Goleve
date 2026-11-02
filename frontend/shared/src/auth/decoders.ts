import { ApiError } from '../api/errors';
import type { AuthResponse, PublicUser, Role } from '../contracts/domain';
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const roles:readonly Role[]=['utilizador','profissional','gestor','administrador'];
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
