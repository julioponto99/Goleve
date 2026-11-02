import { NextFunction,Request,Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../config/errors';
export interface Context {identity:{id:string;userType:string;roleVersion?:number};bearer:string;requestId:string}
export async function readIdentity(origin:string,bearer:string){
 if(!/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(bearer)||bearer.length>4096)throw new ApiError(401,'AUTHENTICATION_REQUIRED','Bearer required');
 try{const r=await fetch(origin+'/auth/me',{headers:{Authorization:bearer},redirect:'error',signal:AbortSignal.timeout(3000)});if([401,403].includes(r.status))throw new ApiError(401,'INVALID_TOKEN','Invalid access token');if(!r.ok)throw Error();const b=await r.json() as any;if(!b.user||typeof b.user.id!=='string'||!/^[a-f0-9]{24}$/.test(b.user.id)||!['utilizador','profissional','gestor','administrador'].includes(b.user.userType)||b.user.accountStatus==='suspended')throw Error();return{id:b.user.id as string,userType:b.user.userType as string,roleVersion:Number.isSafeInteger(b.user.roleVersion)?b.user.roleVersion:0};}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(503,'AUTH_UNAVAILABLE','Current identity cannot be confirmed');}
}
export function authenticate(origin:string){return async(req:Request,res:Response,next:NextFunction)=>{try{const bearer=req.get('authorization')||'',identity=await readIdentity(origin,bearer);res.locals.context={identity,bearer,requestId:randomUUID()} satisfies Context;next();}catch(e){next(e);}};}
