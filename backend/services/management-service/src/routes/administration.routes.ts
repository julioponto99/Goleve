import express,{Router} from 'express';
import { randomUUID } from 'node:crypto';
import { ContractConfig,verifyService } from '../management-contract';
import { readIdentity } from '../middlewares/auth.middleware';
import { ManagementService } from '../services/management.service';
import { OwnerClient } from '../services/owner-client.service';
import { object,id,page,reason,version } from '../config/validation';
import { ApiError } from '../config/errors';
const wrap=(fn:(req:any,res:any)=>Promise<unknown>)=>(req:any,res:any,next:any)=>{void fn(req,res).catch(next);};
export function administrationOwnerAuthorization(service:ManagementService,config:ContractConfig,authOrigin:string){const r=Router();r.use(express.json({limit:'16kb'}));r.post('/administration-authorize',wrap(async(req,res)=>{
 const bearer=req.get('x-management-user-authorization')||'';await verifyService(service.connection,config,'professional','/internal/v1/management/administration-authorize',req.body,bearer,req.get('authorization'));const identity=await readIdentity(authOrigin,bearer),ctx={identity,bearer,requestId:randomUUID()},b=object(req.body,['action','targetId','parameters','stepUpToken']);
 if(!['professional.admin.read','professional.admin.suspend','professional.admin.service.suspend','professional.simulated.review'].includes(String(b.action))||b.action==='professional.simulated.review'&&!['development','test'].includes(process.env.NODE_ENV||''))throw new ApiError(403,'ACTION_FORBIDDEN','Administrative operation not permitted');
 await service.ports.adminCheck(ctx,String(b.action),String(b.targetId),b.parameters||{},b.stepUpToken as string|undefined);res.set('Cache-Control','no-store').json({authorized:true,actorId:identity.id,action:b.action,targetId:b.targetId});
 }));return r;}
export function administrationPublicRoutes(service:ManagementService){const r=Router();r.use((_req,res,next)=>{service.admin(res.locals.context);next();});
 const client=()=>{if(!(service.ports instanceof OwnerClient))throw new ApiError(503,'OWNER_UNAVAILABLE','Permanent service contracts required');return service.ports.client;};
 for(const name of ['professionals','applications','services'])r.get('/'+name,wrap(async(req,res)=>{const options=page(req.query),ctx=res.locals.context;await service.ports.adminCheck(ctx,'administration.read','professional',{});const result=await client().call<any>('professional','administration/'+name,options,ctx.bearer);res.json({data:result});}));
 r.get('/professionals/:id/history',wrap(async(req,res)=>{const ctx=res.locals.context,target=id(req.params.id);await service.ports.adminCheck(ctx,'administration.read','professional',{});res.json({data:await client().call('professional','administration/history',{...page(req.query),resourceId:target},ctx.bearer)});}));
 for(const [path,operation,action]of [['professionals','suspend','professional.admin.suspend'],['services','service-suspend','professional.admin.service.suspend']])r.post('/'+path+'/:id/suspend',wrap(async(req,res)=>{const ctx=res.locals.context,target=id(req.params.id),b=object(req.body,['reasonCode']),reasonCode=reason(b.reasonCode),n=version(req.get('if-match'),target);const result=await client().call<any>('professional','administration/'+operation,{resourceId:target,version:n,reasonCode,stepUpToken:req.get('x-admin-step-up')||'',action},ctx.bearer);res.set('ETag','"'+result.id+':'+result.version+'"').json({data:result});}));
 return r;}
