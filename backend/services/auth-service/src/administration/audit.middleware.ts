import { ErrorRequestHandler } from 'express';
import { SecurityService } from './security.service';
import { ApiError } from '../config/errors';
export const auditAdministrativeFailure:ErrorRequestHandler=(error,req,res,next)=>{
 const ctx=res.locals.security;if(!ctx)return next(error);
 const resource=/^[a-f0-9]{24}$/.test(req.params.id||'')?req.params.id:String(ctx.user._id),action='request.'+req.method.toLowerCase()+'.failed',result=error instanceof ApiError&&error.statusCode<500?'denied':'failed';
 void (res.app.locals.security as SecurityService||new SecurityService()).audit(String(ctx.user._id),action,resource,undefined,error instanceof ApiError?error.code:'OPERATION_FAILED',result).then(()=>next(error)).catch(()=>next(new ApiError(503,'AUDIT_UNAVAILABLE','Administrative auditing unavailable')));
};
