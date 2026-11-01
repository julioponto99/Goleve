import { Connection } from 'mongoose';
import { ContractConfig } from '../management-contract';
import { managementOwnerRoutes,metrics,ownerPage } from '../management-owner';
import { integratedPaymentModel } from './models';
import { ApiError } from '../config/errors';
export function createManagementRoutes(connection:Connection,config:ContractConfig){
 const Model=integratedPaymentModel(connection);
 return managementOwnerRoutes(connection,config,async(op,b)=>{
  const filter:any={serviceId:{$in:b.serviceIds}};
  if(op==='resource'){if(typeof b.resourceId!=='string'||!/^[a-f0-9]{24}$/.test(b.resourceId)||!await Model.exists({...filter,_id:b.resourceId}))throw new ApiError(404,'NOT_FOUND','Payment outside assigned services');return{resourceId:b.resourceId};}
  if(op==='metrics')return{metricCode:'payments.created',...await metrics(Model,filter,b,true)};
  const p=ownerPage(b);if(p.q)throw new ApiError(400,'VALIDATION_ERROR','Financial free-text search not permitted');if(b.status!==undefined){if(!['pending','processing','approved','declined','free','unknown','cancelled','expired','failed'].includes(b.status))throw new ApiError(400,'VALIDATION_ERROR','Invalid payment state');filter.state=b.status;}if(p.before)filter._id={$lt:p.before};
  const rows=await Model.find(filter).sort({_id:-1}).limit(p.limit+1);return{simulated:true,items:rows.slice(0,p.limit).map(p=>({id:String(p._id),appointmentId:p.appointmentId,serviceId:p.serviceId,state:p.state,refundPending:p.refundPending,reconciliationRequired:p.reconciliationRequired,version:p.version,simulated:true})),nextBefore:rows.length>p.limit?String(rows[p.limit-1]._id):null};
 });
}
