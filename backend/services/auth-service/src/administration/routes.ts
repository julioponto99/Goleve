import { Router } from 'express';
import { AuthUser } from '../models/auth-user.model';
import { authenticate } from '../middlewares/auth.middleware';
import { SecurityService,object,identifier,ACTIONS } from './security.service';
import { ApiError } from '../config/errors';
import { ContractConfig,verifyService } from '../management-contract';
import { canonical,digest } from './crypto';
const wrap=(fn:(req:any,res:any)=>Promise<unknown>)=>(req:any,res:any,next:any)=>{void fn(req,res).catch(next);};
export function securityRoutes(service=new SecurityService()){
 const r=Router();r.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 r.use('/mfa',(req,res,next)=>{void service.limit('mfa-http:'+digest((req.ip||'unknown')+req.path),30).then(()=>next()).catch(next);});
 // MFA handlers use challenge capabilities, never an unverified administrative JWT.
 r.post('/mfa/enroll',wrap(async(req,res)=>res.json({data:await service.enroll(req.body)})));
 r.post('/mfa/complete',wrap(async(req,res)=>res.json(await service.complete(req.body))));
 r.post('/initial-admin-invitation/accept',wrap(async(req,res)=>res.status(201).json({data:await service.acceptSecond(req.body)})));
 r.post('/admin/step-up',authenticate,wrap(async(req,res)=>res.status(201).json({data:await service.stepUp(res.locals.security,req.body)})));
 r.post('/logout',authenticate,wrap(async(req,res)=>{object(req.body||{},[]);await service.models.Session.updateOne({_id:res.locals.security.session._id},{$set:{revokedAt:new Date(service.now()),reasonCode:'logout'}});res.status(204).end();}));
 r.get('/sessions',authenticate,wrap(async(_req,res)=>{const rows=await service.models.Session.find({userId:String(res.locals.security.user._id),revokedAt:{$exists:false},expiresAt:{$gt:new Date(service.now())}}).sort({createdAt:-1}).limit(100);res.json({data:{items:rows.map(s=>({id:s._id,current:s._id===res.locals.security.session._id,createdAt:s.createdAt,expiresAt:s.expiresAt,mfa:s.mfa}))}});}));
 return r;
}
function pagination(query:any):{limit:number;before?:string;q?:string;role?:string;status?:string}{const q=object(query,['limit','before','q','role','status']),limit=q.limit===undefined?20:Number(q.limit);if(!Number.isInteger(limit)||limit<1||limit>100||q.before!==undefined&&!/^[a-f0-9]{24}$/.test(q.before)||q.q!==undefined&&(typeof q.q!=='string'||q.q.length>80))throw new ApiError(400,'VALIDATION_ERROR','Invalid pagination');return{...q,limit};}
export function administrationRoutes(service=new SecurityService()){
 const r=Router();r.use(authenticate,(_req,res,next)=>{res.set('Cache-Control','no-store');void service.admin(res.locals.security).then(()=>next()).catch(next);});
 const proof=(req:any)=>req.get('x-admin-step-up')||'';
 r.get('/users',wrap(async(req,res)=>{const q=pagination(req.query),filter:any={};if(q.before)filter._id={$lt:q.before};if(q.role!==undefined){if(!['utilizador','profissional','gestor','administrador'].includes(q.role))throw new ApiError(400,'VALIDATION_ERROR','Invalid role');filter.userType=q.role;}if(q.status!==undefined){if(!['active','suspended'].includes(q.status))throw new ApiError(400,'VALIDATION_ERROR','Invalid status');if(q.status==='active')filter.accountStatus={$ne:'suspended'};else filter.accountStatus='suspended';}if(q.q){const escaped=Array.from(q.q as string,c=>[92,94,36,46,42,43,63,40,41,91,93,123,125,124].includes(c.charCodeAt(0))?String.fromCharCode(92)+c:c).join('');filter.$or=[{name:{$regex:escaped,$options:'i'}},{email:{$regex:escaped,$options:'i'}}];}await service.audit(String(res.locals.userId),'users.read','users');const rows=await AuthUser.find(filter).sort({_id:-1}).limit(q.limit+1);res.json({data:{items:rows.slice(0,q.limit).map(u=>service.userDto(u)),nextBefore:rows.length>q.limit?String(rows[q.limit-1]._id):null}});}));
 r.get('/users/:id',wrap(async(req,res)=>{const u=await AuthUser.findById(identifier(req.params.id));if(!u)throw new ApiError(404,'NOT_FOUND','Account not found');await service.audit(String(res.locals.userId),'user.read',req.params.id);res.json({data:service.userDto(u)});}));
 for(const action of ['suspend','reactivate','revoke'] as const)r.post('/users/:id/'+action,wrap(async(req,res)=>res.json({data:await service.userAction(res.locals.security,req.params.id,action,req.body,proof(req))})));
 r.post('/users/:id/role-requests',wrap(async(req,res)=>res.status(201).json({data:await service.requestRole(res.locals.security,req.params.id,req.body,proof(req))})));
 r.get('/role-requests',wrap(async(req,res)=>{const q=pagination(req.query);if(q.q!==undefined||q.role!==undefined||q.status!==undefined&&!['pending','approved','rejected'].includes(q.status))throw new ApiError(400,'VALIDATION_ERROR','Invalid role request filter');const rows=await service.models.RoleRequest.find({...q.before?{_id:{$lt:q.before}}:{},...q.status?{status:q.status}:{}}).sort({_id:-1}).limit(q.limit+1);await service.audit(String(res.locals.userId),'role.requests.read','roles');res.json({data:{items:rows.slice(0,q.limit).map(x=>({id:String(x._id),targetId:x.targetId,newRole:x.newRole,status:x.status,requestedBy:x.requestedBy,approvedBy:x.approvedBy,reasonCode:x.reasonCode,version:x.version,createdAt:x.createdAt})),nextBefore:rows.length>q.limit?String(rows[q.limit-1]._id):null}});}));
 for(const action of ['approve','reject'])r.post('/role-requests/:id/'+action,wrap(async(req,res)=>res.json({data:await service.decideRole(res.locals.security,req.params.id,action==='approve',req.body,proof(req))})));
 r.get('/users/:id/history',wrap(async(req,res)=>{const target=identifier(req.params.id),q=pagination(req.query);if(q.q!==undefined||q.role!==undefined||q.status!==undefined)throw new ApiError(400,'VALIDATION_ERROR','Only pagination is supported');if(!await AuthUser.exists({_id:target}))throw new ApiError(404,'NOT_FOUND','Account not found');await service.audit(String(res.locals.userId),'user.history.read',target);const rows=await service.models.Audit.find({resourceId:target,...q.before?{_id:{$lt:q.before}}:{}}).sort({_id:-1}).limit(q.limit+1);res.json({data:{items:rows.slice(0,q.limit).map(x=>({id:String(x._id),actorId:x.actorId,action:x.action,resourceId:x.resourceId,occurredAt:x.occurredAt,result:x.result,reasonCode:x.reasonCode,correlationId:x.correlationId})),nextBefore:rows.length>q.limit?String(rows[q.limit-1]._id):null}});}));
 r.get('/audit',wrap(async(req,res)=>{const q=pagination(req.query);if(q.q!==undefined||q.role!==undefined||q.status!==undefined)throw new ApiError(400,'VALIDATION_ERROR','Only pagination is supported');const rows=await service.models.Audit.find(q.before?{_id:{$lt:q.before}}:{}).sort({_id:-1}).limit(q.limit+1);res.json({data:{items:rows.slice(0,q.limit).map(x=>({id:String(x._id),actorId:x.actorId,action:x.action,resourceId:x.resourceId,occurredAt:x.occurredAt,result:x.result,reasonCode:x.reasonCode,correlationId:x.correlationId})),nextBefore:rows.length>q.limit?String(rows[q.limit-1]._id):null}});}));
 return r;
}
export function internalAdministrationRoutes(config:ContractConfig,service=new SecurityService()){
 const r=Router();r.post('/admin-check',wrap(async(req,res)=>{
  const bearer=req.get('x-management-user-authorization')||'';await verifyService(AuthUser.db,config,'management','/internal/v1/management/admin-check',req.body,bearer,req.get('authorization'));const b=object(req.body,['action','targetId','parameters','stepUpToken']),ctx=await service.context(bearer);await service.admin(ctx);
  if(typeof b.action!=='string'||typeof b.targetId!=='string')throw new ApiError(400,'VALIDATION_ERROR','Action and target required');
  if(b.stepUpToken!==undefined){if(!ACTIONS.includes(b.action as any)||!['management.','professional.'].some(prefix=>b.action.startsWith(prefix)))throw new ApiError(403,'ACTION_FORBIDDEN','Unknown sensitive action');await service.transaction(async session=>{await service.consume(ctx,b.stepUpToken,b.action,b.targetId,b.parameters||{},session);await service.audit(String(ctx.user._id),b.action+'.authorized',b.targetId,session);});}
  else if(!['administration.read','professional.admin.read'].includes(b.action))throw new ApiError(403,'STEP_UP_REQUIRED','Sensitive action requires proof');
  res.set('Cache-Control','no-store').json({actorId:String(ctx.user._id),action:b.action,targetId:b.targetId,parametersHash:digest(canonical(b.parameters||{})),authorized:true});
 }));return r;
}
