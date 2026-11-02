import { Request,Response,NextFunction } from 'express';
import { ManagementService } from '../services/management.service';
import { ApiError } from '../config/errors';
export function administrativeAuthorization(service:ManagementService){return(req:Request,res:Response,next:NextFunction)=>{void(async()=>{
 const ctx=res.locals.context;if(ctx.identity.userType!=='administrador')return;
 const path=decodeURIComponent(req.path).toLowerCase().replace(/\/+$/, '')||'/';let action:string|undefined,target='management',parameters:unknown=req.body||{};
 if(req.method==='POST'&&path==='/operators'){action='management.operator.create';target=req.body?.authUserId;}
 else if(req.method==='POST'&&path==='/scopes'){action='management.scope.create';target='new';}
 else if(req.method==='POST'&&path==='/assignments'){action='management.assignment.request';target=req.body?.operatorProfileId;}
 else {const m=/^\/assignments\/([a-f0-9]{24})\/(approve|reject|request-revocation|approve-revocation)$/.exec(path);if(req.method==='POST'&&m){action='management.assignment.'+m[2];target=m[1];parameters={body:req.body||{},ifMatch:req.get('if-match')||null};}}
 if(action){const proof=req.get('x-admin-step-up');if(!proof)throw new ApiError(403,'STEP_UP_REQUIRED','Administrative operation requires one-use authorization');if(typeof target!=='string')throw new ApiError(400,'VALIDATION_ERROR','Target required');await service.ports.adminCheck(ctx,action,target,parameters,proof);}
 else await service.ports.adminCheck(ctx,'administration.read',target,{});
 })().then(()=>next()).catch(next);};}
