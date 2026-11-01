import { ContractClient } from '../management-contract';
import { Context } from '../middlewares/auth.middleware';
import { OwnerPorts } from './management.service';
import { ApiError } from '../config/errors';
export class OwnerClient implements OwnerPorts {
 constructor(readonly client:ContractClient){}
 identity(ctx:Context,authUserId:string){return this.client.call<{id:string;userType:string}>('auth','identity',{authUserId},ctx.bearer);}
 async validateServices(ctx:Context,serviceIds:string[]){const r=await this.client.call<{serviceIds:string[]}>('professional','validate',{serviceIds,permission:'scope.validate'},ctx.bearer);if(!r||JSON.stringify([...r.serviceIds].sort())!==JSON.stringify([...serviceIds].sort()))throw new Error('Canonical service validation failed');}
 async query(ctx:Context,owner:'professional'|'agenda'|'payment',action:string,input:Record<string,unknown>){
  const result=await this.client.call<any>(owner,action,input,ctx.bearer),fail=():never=>{throw new ApiError(503,'INVALID_OWNER_RESPONSE','Owner response violates the operational contract');},pick=(value:any,keys:string[])=>Object.fromEntries(keys.filter(k=>value[k]!==undefined).map(k=>[k,value[k]])),scope=input.serviceIds as string[];
  if(!result||typeof result!=='object')return fail();
  if(action==='resource'){if(result.resourceId!==input.resourceId)return fail();return{resourceId:result.resourceId};}
  if(action==='metrics'){
   if(result.metricCode!==({professional:'services.created',agenda:'appointments.created',payment:'payments.created'}[owner]))return fail();
   if(!Array.isArray(result.series)||result.series.length>31||typeof result.simulated!=='boolean'||typeof result.computedAt!=='string'||!Number.isFinite(Date.parse(result.computedAt))||result.policy!=='utc-daily-portfolio-ranges-v1')return fail();
   const days=new Set();for(const row of result.series){if(typeof row.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(row.day)||days.has(row.day)||row.value!==null||typeof row.suppressed!=='boolean'||row.suppressed&&row.range!==null||!row.suppressed&&(!row.range||!Number.isInteger(row.range.min)||row.range.min<5||row.range.min%5||row.range.max!==row.range.min+4))return fail();days.add(row.day);}
   return{metricCode:result.metricCode,simulated:result.simulated,computedAt:result.computedAt,policy:result.policy,series:result.series.map((r:any)=>({day:r.day,value:null,suppressed:r.suppressed,range:r.suppressed?null:{min:r.range.min,max:r.range.max}}))};
  }
  if(['suspend','reactivate'].includes(action)){if(result.id!==input.serviceId||result.version!==Number(input.version)+1||result.active!==(action==='reactivate')||result.managementSuspended!==(action==='suspend'))return fail();return pick(result,['id','active','managementSuspended','version','dataAuthority']);}
  if(!Array.isArray(result.items)||result.items.length>Number(input.limit||20)||result.nextBefore!==null&&(typeof result.nextBefore!=='string'||!/^[a-f0-9]{24}$/.test(result.nextBefore)))return fail();
  const fields:Record<string,string[]>={services:['id','professionalId','capabilityId','name','category','durationMinutes','active','managementSuspended','version','dataAuthority'],professionals:['id','professionalName','status','dataAuthority'],appointments:['id','serviceId','professionalId','status','appointmentType','startAtUtc','endAtUtc','version','rescheduleOfId','rescheduledToId'],payments:['id','appointmentId','serviceId','state','refundPending','reconciliationRequired','version','simulated']};
  if(!fields[action]||action==='payments'&&result.simulated!==true)return fail();
  for(const row of result.items)if(!row||typeof row.id!=='string'||!/^[a-f0-9]{24}$/.test(row.id)||action==='services'&&!scope.includes(row.id)||['appointments','payments'].includes(action)&&!scope.includes(row.serviceId))return fail();
  return{items:result.items.map((r:any)=>pick(r,fields[action])),nextBefore:result.nextBefore,...(action==='payments'?{simulated:true}:{})};
 }
}
