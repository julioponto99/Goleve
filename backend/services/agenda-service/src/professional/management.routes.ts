import { Connection } from 'mongoose';
import { ProfessionalAgendaModels } from './models';
import { ContractConfig } from '../management-contract';
import { managementOwnerRoutes,metrics,ownerPage } from '../management-owner';
import { ApiError } from '../config/errors';
export function createManagementRoutes(connection:Connection,models:ProfessionalAgendaModels,config:ContractConfig){
 return managementOwnerRoutes(connection,config,async(op,b)=>{
  const filter:any={serviceId:{$in:b.serviceIds}};
  if(op==='resource'){if(typeof b.resourceId!=='string'||!/^[a-f0-9]{24}$/.test(b.resourceId)||!await models.Appointment.exists({...filter,_id:b.resourceId}))throw new ApiError(404,'NOT_FOUND','Reservation outside assigned services');return{resourceId:b.resourceId};}
  if(op==='metrics')return{metricCode:'appointments.created',...await metrics(models.Appointment,filter,b,true)};
  const p=ownerPage(b);if(p.q)throw new ApiError(400,'VALIDATION_ERROR','No free-text search on reservation participants');if(b.status!==undefined){if(!['requested','accepted','declined','cancelled','expired','completed'].includes(b.status))throw new ApiError(400,'VALIDATION_ERROR','Invalid reservation status');filter.status=b.status;}if(p.before)filter._id={$lt:p.before};
  const rows=await models.Appointment.find(filter).sort({_id:-1}).limit(p.limit+1);return{items:rows.slice(0,p.limit).map(a=>({id:String(a._id),serviceId:a.serviceId,professionalId:a.professionalId,status:a.status,appointmentType:a.appointmentType,startAtUtc:a.startAtUtc,endAtUtc:a.endAtUtc,version:a.version,rescheduleOfId:a.rescheduleOfId,rescheduledToId:a.rescheduledToId})),nextBefore:rows.length>p.limit?String(rows[p.limit-1]._id):null};
 });
}
