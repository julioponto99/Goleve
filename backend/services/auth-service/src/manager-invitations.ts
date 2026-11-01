import { Router } from 'express';
import { createHash,randomBytes,randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { Schema } from 'mongoose';
import { AuthUser } from './models/auth-user.model';
import { ApiError } from './config/errors';
import { validateRegister } from './config/validation';
import { authenticate } from './middlewares/auth.middleware';
import { ContractConfig,verifyService } from './management-contract';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
function body(value:unknown,keys:string[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw new ApiError(400,'VALIDATION_ERROR','Invalid invitation request');return value as Record<string,unknown>;}
export function invitationModels(){
 const c=AuthUser.db;
 const invitation=new Schema({email:{type:String,required:true,maxlength:254},tokenHash:{type:String,required:true,select:false},status:{type:String,enum:['pending','accepted','revoked','expired'],required:true},createdBy:{type:String,required:true},expiresAt:{type:Date,required:true},acceptedBy:String,acceptedAt:Date,revokedBy:String,revokedAt:Date},{strict:'throw',timestamps:true,versionKey:false,collection:'auth_manager_invitations'});
 invitation.index({tokenHash:1},{unique:true});invitation.index({email:1},{unique:true,partialFilterExpression:{status:'pending'}});
 const audit=new Schema({actorId:String,invitationId:String,action:String,occurredAt:Date,requestId:String},{strict:'throw',versionKey:false,collection:'auth_manager_invitation_audit'});
 return{Invitation:c.models.ManagerInvitation||c.model('ManagerInvitation',invitation),Audit:c.models.ManagerInvitationAudit||c.model('ManagerInvitationAudit',audit)};
}
export function managerInvitationRoutes(){
 const r=Router();r.use((_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 const admin=async(_req:any,res:any,next:any)=>{try{const a=await AuthUser.findOne({_id:res.locals.userId,userType:'administrador'}).select('_id');if(!a)throw new ApiError(403,'ADMIN_REQUIRED','Current administrator required');next();}catch(e){next(e);}};
 const transact=async<T>(work:(session:any)=>Promise<T>)=>{const c=AuthUser.db,hello=await c.db!.admin().command({hello:1});if(!hello.setName)throw new ApiError(503,'TRANSACTION_REQUIRED','Invitations require transactional persistence');const session=await c.startSession();try{return await session.withTransaction(()=>work(session),{readConcern:{level:'snapshot'},writeConcern:{w:'majority'},maxCommitTimeMS:5000});}finally{await session.endSession();}};
 r.post('/',authenticate,admin,async(req,res,next)=>{try{
   const b=body(req.body,['email']);if(typeof b.email!=='string')throw new ApiError(400,'VALIDATION_ERROR','Email required');const email=b.email.trim().toLowerCase();if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\u0000-\u001f\u007f]/.test(email))throw new ApiError(400,'VALIDATION_ERROR','Invalid email');
   const token=randomBytes(32).toString('base64url'),m=invitationModels();await Promise.all(Object.values(m).map(x=>x.init()));
   const result=await transact(async session=>{if(await AuthUser.exists({email}).session(session))throw new ApiError(409,'ACCOUNT_EXISTS','Invitation cannot modify an existing account');await m.Invitation.updateMany({email,status:'pending',expiresAt:{$lte:new Date()}},{$set:{status:'expired'}},{session});const [i]=await m.Invitation.create([{email,tokenHash:hash(token),status:'pending',createdBy:res.locals.userId,expiresAt:new Date(Date.now()+86400000)}],{session});await m.Audit.create([{actorId:res.locals.userId,invitationId:String(i._id),action:'issued',occurredAt:new Date(),requestId:randomUUID()}],{session});return{id:String(i._id),expiresAt:i.expiresAt};});res.status(201).json({data:{...result,token}});
 }catch(e){next(e);}});
 r.post('/:id/revoke',authenticate,admin,async(req,res,next)=>{try{if(!/^[a-f0-9]{24}$/.test(req.params.id))throw new ApiError(400,'VALIDATION_ERROR','Invalid invitation');body(req.body||{},[]);const m=invitationModels();await transact(async session=>{const i=await m.Invitation.findOneAndUpdate({_id:req.params.id,status:'pending',expiresAt:{$gt:new Date()}},{$set:{status:'revoked',revokedBy:res.locals.userId,revokedAt:new Date()}},{new:true,session});if(!i)throw new ApiError(409,'INVITATION_UNAVAILABLE','Invitation is not pending');await m.Audit.create([{actorId:res.locals.userId,invitationId:req.params.id,action:'revoked',occurredAt:new Date(),requestId:randomUUID()}],{session});});res.status(204).end();}catch(e){next(e);}});
 const attempts=new Map<string,{count:number;until:number}>();
 r.post('/accept',async(req,res,next)=>{try{
   const key=req.ip||'unknown',now=Date.now();for(const [k,v]of attempts)if(v.until<=now)attempts.delete(k);if(attempts.size>10000&&!attempts.has(key))throw new ApiError(429,'RATE_LIMITED','Try again later');const limit=attempts.get(key)||{count:0,until:now+900000};if(++limit.count>10)throw new ApiError(429,'RATE_LIMITED','Try again later');attempts.set(key,limit);
   const b=body(req.body,['token','name','password']);if(typeof b.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(b.token))throw new ApiError(400,'INVALID_INVITATION','Invalid invitation');const m=invitationModels(),i=await m.Invitation.findOne({tokenHash:hash(b.token),status:'pending',expiresAt:{$gt:new Date()}});if(!i)throw new ApiError(410,'INVITATION_UNAVAILABLE','Invitation unavailable');const input=validateRegister({email:i.email,name:b.name,password:b.password}),passwordHash=await bcrypt.hash(input.password,12);
   const result=await transact(async session=>{const invitation=await m.Invitation.findOneAndUpdate({_id:i._id,status:'pending',expiresAt:{$gt:new Date()}},{$set:{status:'accepted',acceptedAt:new Date()}},{new:true,session});if(!invitation)throw new ApiError(410,'INVITATION_UNAVAILABLE','Invitation unavailable');const [user]=await AuthUser.create([{name:input.name,email:input.email,passwordHash,userType:'gestor' as const}],{session});await m.Invitation.updateOne({_id:i._id},{$set:{acceptedBy:String(user._id)}},{session});await m.Audit.create([{actorId:String(user._id),invitationId:String(i._id),action:'accepted',occurredAt:new Date(),requestId:randomUUID()}],{session});return{id:String(user._id),userType:'gestor',onboarding:'requires_administrator_and_scope_assignment'};});res.status(201).json({data:result});
 }catch(e){next(e);}});return r;
}
export function managementIdentityRoutes(config:ContractConfig){
 const r=Router();r.post('/identity',async(req,res,next)=>{try{const bearer=req.get('x-management-user-authorization')||'';await verifyService(AuthUser.db,config,'management','/internal/v1/management/identity',req.body,bearer,req.get('authorization'));const b=body(req.body,['authUserId']);if(typeof b.authUserId!=='string'||!/^[a-f0-9]{24}$/.test(b.authUserId))throw new ApiError(400,'VALIDATION_ERROR','Identity required');
   const match=/^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(bearer);if(!match)throw new ApiError(401,'INVALID_TOKEN','Bearer required');const actor=await AuthUser.findOne({_id:require('./config/token').verifyAccessToken(match[1]),userType:'administrador'});if(!actor)throw new ApiError(403,'ADMIN_REQUIRED','Administrator required');const target=await AuthUser.findById(b.authUserId).select('_id userType');if(!target)throw new ApiError(404,'NOT_FOUND','Identity not found');res.set('Cache-Control','no-store').json({id:String(target._id),userType:target.userType});
 }catch(e){next(e);}});return r;
}
