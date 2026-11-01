import express,{Router,Request,Response,NextFunction} from 'express';
import { ManagementService } from '../services/management.service';
import { Context,readIdentity } from '../middlewares/auth.middleware';
import { PERMISSIONS,ids,object,page,version } from '../config/validation';
import { ApiError } from '../config/errors';
import { ContractConfig,verifyService } from '../management-contract';
const work=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{void fn(req,res).catch(next);};
const ctx=(res:Response)=>res.locals.context as Context;
export function managementRoutes(service:ManagementService){
 const r=Router(),send=(res:Response,result:any,status=200)=>{if(result?.id&&result.version)res.set('ETag','"'+result.id+':'+result.version+'"');res.status(status).json({data:result});};
 r.get('/me',work(async(req,res)=>send(res,await service.me(ctx(res)))));
 r.post('/operators',work(async(req,res)=>send(res,await service.createOperator(ctx(res),req.body),201)));
 r.post('/scopes',work(async(req,res)=>send(res,await service.createScope(ctx(res),req.body),201)));
 r.get('/scopes',work(async(req,res)=>send(res,await service.scopes(ctx(res),req.query))));
 r.post('/assignments',work(async(req,res)=>send(res,await service.requestAssignment(ctx(res),req.body),201)));
 r.get('/assignments',work(async(req,res)=>send(res,await service.listAssignments(ctx(res),req.query))));
 for(const action of ['approve','request-revocation','approve-revocation'] as const)r.post('/assignments/:id/'+action,work(async(req,res)=>send(res,await service.assignmentAction(ctx(res),req.params.id,action,version(req.get('if-match'),req.params.id),req.body))));
 for(const [route,owner,action,permission] of [['professionals','professional','professionals','professionals.read'],['services','professional','services','services.read'],['appointments','agenda','appointments','appointments.read'],['payments','payment','payments','payments.read']] as const)r.get('/'+route,work(async(req,res)=>send(res,await service.readOwner(ctx(res),owner,action,permission,req.query))));
 for(const action of ['suspend','reactivate'] as const)r.post('/services/:id/'+action,work(async(req,res)=>send(res,await service.serviceAction(ctx(res),req.params.id,action,version(req.get('if-match'),req.params.id),req.body))));
 r.post('/cases',work(async(req,res)=>send(res,await service.createCase(ctx(res),req.body),201)));
 r.get('/cases',work(async(req,res)=>send(res,await service.listCases(ctx(res),req.query))));
 r.patch('/cases/:id',work(async(req,res)=>send(res,await service.updateCase(ctx(res),req.params.id,version(req.get('if-match'),req.params.id),req.body))));
 r.get('/cases/:id/history',work(async(req,res)=>send(res,await service.caseHistory(ctx(res),req.params.id,req.query))));
 r.get('/audit',work(async(req,res)=>send(res,await service.listAudit(ctx(res),req.query))));
 r.get('/dashboard',work(async(req,res)=>{
   const b=object(req.query,['from','to']),from=String(b.from),to=String(b.to),a=new Date(from),z=new Date(to);if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||!Number.isFinite(a.getTime())||!Number.isFinite(z.getTime())||a.toISOString().slice(0,10)!==from||z.toISOString().slice(0,10)!==to||z<=a||z.getTime()-a.getTime()>31*86400000)throw new ApiError(400,'VALIDATION_ERROR','UTC date interval of at most 31 days required');
   const g=await service.authorize(ctx(res),'dashboard.read');await service.audit(ctx(res),'dashboard.read','operator',String(g.operator._id),'intent');
   const sources=await Promise.all((['professional','agenda','payment'] as const).map(async owner=>{try{const result=await service.ports.query(ctx(res),owner,'metrics',{serviceIds:g.serviceIds,permission:'dashboard.read',from:a.toISOString(),to:z.toISOString()});return{source:owner,status:'available',...result};}catch{return{source:owner,status:'unavailable'};}}));
   await service.audit(ctx(res),'dashboard.read','operator',String(g.operator._id));send(res,{from,to,partial:sources.some(s=>s.status!=='available'),sources});
 }));return r;
}
export function authorizationRoutes(service:ManagementService,config:ContractConfig,authOrigin:string){
 const r=Router();r.use(express.json({limit:'16kb'}));r.post('/authorize',work(async(req,res)=>{
  const caller=req.get('x-management-caller');if(!['professional','agenda','payment'].includes(caller||''))throw new ApiError(401,'INVALID_CALLER','Known owner required');const bearer=req.get('x-management-user-authorization')||'';
  await verifyService(service.connection,config,caller as 'professional'|'agenda'|'payment','/internal/v1/management/authorize',req.body,bearer,req.get('authorization'));
  const identity=await readIdentity(authOrigin,bearer),context={identity,bearer,requestId:require('node:crypto').randomUUID()} as Context,b=object(req.body,['serviceIds','permission']),serviceIds=ids(b.serviceIds,500);
  const permitted:Record<string,string[]>={professional:['scope.validate','professionals.read','services.read','services.suspend','services.reactivate','cases.write','dashboard.read'],agenda:['appointments.read','cases.write','dashboard.read'],payment:['payments.read','cases.write','dashboard.read']};if(!permitted[caller!].includes(String(b.permission)))throw new ApiError(403,'PERMISSION_FORBIDDEN','Owner permission mismatch');
  if(b.permission==='scope.validate')service.admin(context);else{if(!PERMISSIONS.includes(b.permission as any))throw new ApiError(403,'PERMISSION_FORBIDDEN','Known permission required');await service.authorize(context,b.permission as any,serviceIds);}
  res.set('Cache-Control','no-store').json({actorId:identity.id,permission:b.permission,serviceIds,checkedAt:new Date().toISOString()});
 }));return r;
}
