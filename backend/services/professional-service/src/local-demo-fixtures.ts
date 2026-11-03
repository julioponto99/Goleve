import { Connection, Schema } from 'mongoose';
import { localDemo } from './local-demo';
import { ProfessionalModels } from './models';
export function entitlementModel(connection:Connection) {
  return connection.models.LocalDemoProfessionalEntitlement||connection.model('LocalDemoProfessionalEntitlement',new Schema({
    _id:String,instance:{type:String,required:true},authUserId:{type:String,required:true},professionalId:{type:String,required:true},capabilityId:{type:String,required:true},serviceId:{type:String,required:true},
    authority:{type:String,enum:['synthetic'],required:true},active:{type:Boolean,required:true},expiresAt:{type:Date,required:true},version:{type:Number,default:1},source:{type:String,enum:['explicit_local_demo_cli'],required:true},
  },{strict:'throw',versionKey:false,collection:'professional_local_demo_entitlements'}));
}
export async function fixtureEligible(models:ProfessionalModels,profile:any,capability:any,service:any) {
  const p=localDemo.policy();if(!p||!profile||!capability||!service)return false;
  if(profile.administrativelySuspended||['suspended','archived'].includes(profile.profileStatus)||['suspended','expired','rejected'].includes(capability.status)||service.administrativelySuspended||service.managementSuspended||!service.active)return false;
  if(String(capability.professionalId)!==String(profile._id)||String(service.professionalId)!==String(profile._id)||String(service.capabilityId)!==String(capability._id)||service.authUserId!==profile.authUserId||capability.authUserId!==profile.authUserId)return false;
  const app=await models.Application.exists({professionalId:profile._id,authUserId:profile.authUserId,status:{$in:['pending','approved']}});if(!app)return false;
  const grant=await entitlementModel(models.Profile.db).exists({instance:p.instance,authUserId:profile.authUserId,professionalId:String(profile._id),capabilityId:String(capability._id),serviceId:String(service._id),authority:'synthetic',source:'explicit_local_demo_cli',active:true,expiresAt:{$gt:new Date()}});
  if(!grant)return false;
  await localDemo.currentIdentity(profile.authUserId,'profissional');return true;
}
