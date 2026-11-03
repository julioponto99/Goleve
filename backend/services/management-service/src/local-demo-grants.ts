import { Connection, Schema } from 'mongoose';
import { PERMISSIONS } from './config/validation';
export function demoGrantModel(connection:Connection) {
  return connection.models.LocalDemoManagementGrant||connection.model('LocalDemoManagementGrant',new Schema({
    _id:String,instance:{type:String,required:true},operatorProfileId:{type:String,required:true},scopeId:{type:String,required:true},
    permissions:{type:[String],enum:PERMISSIONS,required:true},validFrom:Date,validUntil:Date,
    status:{type:String,enum:['active','revoked'],required:true},authority:{type:String,enum:['synthetic'],required:true},
    source:{type:String,enum:['explicit_local_demo_cli'],required:true},authRoleVersion:Number,version:{type:Number,default:1},useCounter:{type:Number,default:0},
  },{strict:'throw',versionKey:false,collection:'management_local_demo_grants'}));
}
