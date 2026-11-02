import { Connection,Types } from 'mongoose';
import { ProfessionalModels } from '../models';
import { ContractConfig } from '../management-contract';
import { escaped,managementOwnerRoutes,metrics,ownerPage } from '../management-owner';
import { ApiError } from '../config/errors';
export interface RealEligibilityProof {authority:'real';eligible:true;serviceId:string;professionalId:string;capabilityId:string;checkedAtUtc:string;validUntilUtc:string}
export interface ManagementEligibilityAuthority {verify(serviceId:string):Promise<RealEligibilityProof|null>}
export function createManagementRoutes(connection:Connection,models:ProfessionalModels,config:ContractConfig,authorityForTests?:ManagementEligibilityAuthority){
 if(authorityForTests&&(process.env.NODE_ENV!=='test'||!/^goleve_management510_[a-f0-9]+_professional$/.test(connection.name)))throw new Error('Eligibility injection restricted to isolated automated tests');
 return managementOwnerRoutes(connection,config,async(op,b,actorId)=>{
  const scope={_id:{$in:b.serviceIds}},dataAuthority='synthetic';
  if(op==='validate'){const rows=await models.Service.find(scope).select('_id');if(rows.length!==b.serviceIds.length)throw new ApiError(404,'SERVICE_NOT_FOUND','Every service must exist in the canonical catalogue');return{serviceIds:rows.map(r=>String(r._id))};}
  if(op==='resource'){if(typeof b.resourceId!=='string'||!/^[a-f0-9]{24}$/.test(b.resourceId))throw new ApiError(400,'VALIDATION_ERROR','Resource required');const found=await models.Service.exists({...scope,$or:[{_id:b.resourceId},{professionalId:b.resourceId}]});if(!found)throw new ApiError(404,'NOT_FOUND','Resource outside assigned services');return{resourceId:b.resourceId};}
  if(op==='suspend'||op==='reactivate'){
   if(typeof b.serviceId!=='string'||!b.serviceIds.includes(b.serviceId)||!Number.isSafeInteger(b.version)||b.version<1||typeof b.reasonCode!=='string'||!/^[a-z][a-z0-9_]{2,63}$/.test(b.reasonCode))throw new ApiError(400,'VALIDATION_ERROR','Reason, service and current version required');
   const current=await models.Service.findOne({_id:b.serviceId,version:b.version});if(!current)throw new ApiError(412,'VERSION_CONFLICT','Service version changed');if((current.managementHistory?.length||0)>=128)throw new ApiError(409,'SERVICE_AUDIT_LIMIT','Preserved operational history requires archival policy before another transition');
   if(op==='reactivate'){
    if(current.administrativelySuspended)throw new ApiError(409,'ADMINISTRATIVE_SUSPENSION','A manager cannot lift an administrative suspension');
    const proof=authorityForTests?await authorityForTests.verify(b.serviceId):null,now=Date.now();
    if(!proof||proof.authority!=='real'||!proof.eligible||proof.serviceId!==b.serviceId||proof.professionalId!==String(current.professionalId)||proof.capabilityId!==String(current.capabilityId)||!Number.isFinite(Date.parse(proof.checkedAtUtc))||!Number.isFinite(Date.parse(proof.validUntilUtc))||Date.parse(proof.checkedAtUtc)>now+1000||Date.parse(proof.checkedAtUtc)<now-15000||Date.parse(proof.validUntilUtc)<=now||Date.parse(proof.validUntilUtc)-Date.parse(proof.checkedAtUtc)>15000)throw new ApiError(503,'REAL_ELIGIBILITY_UNAVAILABLE','Authoritative real eligibility required; simulated approval is insufficient');
    const profile=await models.Profile.findOne({_id:current.professionalId,profileStatus:'active'}),cap=await models.Capability.findOne({_id:current.capabilityId,professionalId:current.professionalId,status:'verified'});if(!profile||!cap)throw new ApiError(409,'PROFESSIONAL_INELIGIBLE','Administrative status prevents reactivation');
    if(!current.managementSuspended)throw new ApiError(409,'NOT_MANAGEMENT_SUSPENDED','Only a management suspension can be lifted');
    if(!current.managementWasActive)throw new ApiError(409,'SERVICE_OWNER_INACTIVE','Management cannot reactivate a service already inactive before its suspension');
   }else if(current.managementSuspended)throw new ApiError(409,'ALREADY_SUSPENDED','Service already suspended');
   const record={actorId,action:op,reasonCode:b.reasonCode,occurredAt:new Date(),version:b.version+1};
   const result=await models.Service.findOneAndUpdate({_id:b.serviceId,version:b.version,managementSuspended:op==='reactivate'?true:{$ne:true}},{$set:{active:op==='reactivate',managementSuspended:op==='suspend',...(op==='suspend'?{managementWasActive:current.active}:{})},$inc:{version:1},$push:{managementHistory:record}},{new:true,runValidators:true});
   if(!result)throw new ApiError(412,'VERSION_CONFLICT','Service changed concurrently');return{id:String(result._id),active:result.active,managementSuspended:result.managementSuspended,version:result.version,dataAuthority};
  }
  if(op==='metrics')return{metricCode:'services.created',...await metrics(models.Service,{_id:{$in:b.serviceIds.map((id:string)=>new Types.ObjectId(id))}},b,true)};
  const p=ownerPage(b),filter:any={...scope};if(p.q&&op!=='professionals')filter.name={$regex:escaped(p.q),$options:'i'};
  if(b.status!==undefined){if(!['active','inactive','management_suspended'].includes(b.status))throw new ApiError(400,'VALIDATION_ERROR','Invalid status');Object.assign(filter,b.status==='management_suspended'?{managementSuspended:true}:{active:b.status==='active'});}
  if(op==='professionals'){
   const refs=await models.Service.find(filter).select('professionalId');const query:any={_id:{$in:refs.map(s=>s.professionalId)}};if(p.q)query.professionalName={$regex:escaped(p.q),$options:'i'};if(p.before)query._id={$in:refs.map(s=>s.professionalId),$lt:p.before};const rows=await models.Profile.find(query).sort({_id:-1}).limit(p.limit+1);return{items:rows.slice(0,p.limit).map(p=>({id:String(p._id),professionalName:p.professionalName,status:p.profileStatus,dataAuthority})),nextBefore:rows.length>p.limit?String(rows[p.limit-1]._id):null};
  }
  if(p.before)filter._id={$in:b.serviceIds,$lt:p.before};const rows=await models.Service.find(filter).sort({_id:-1}).limit(p.limit+1);return{items:rows.slice(0,p.limit).map(s=>({id:String(s._id),professionalId:String(s.professionalId),capabilityId:String(s.capabilityId),name:s.name,category:s.category,durationMinutes:s.durationMinutes,active:s.active,managementSuspended:!!s.managementSuspended,version:s.version,dataAuthority})),nextBefore:rows.length>p.limit?String(rows[p.limit-1]._id):null};
 });
}
