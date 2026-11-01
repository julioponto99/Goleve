import { randomUUID } from 'node:crypto';
import { Connection, ClientSession, Schema } from 'mongoose';
import { ApiError } from '../config/errors';
import { ProfessionalAgendaModels, AppointmentData } from '../professional/models';
import { calendarTransaction } from '../professional/transaction';
import { DemoConfig, Quote, assertDemo, oid } from './protocol';
import { DemoEligibility } from './eligibility';
interface LedgerData { _id:string;ownerId:string;professionalAuthUserId:string;currentAppointmentId:string;state:string;attemptId?:string;claimToken?:string;serviceId?:string;priceCents?:number;currency?:string;serviceVersion?:number;quoteExpiresAt?:Date;bankApproved:boolean;free:boolean;refundPending:boolean;reconciliationRequired:boolean;version:number; }
export class AgendaBilling {
  readonly eligibility:DemoEligibility;
  readonly Ledger;
  readonly Event;
  constructor(private readonly connection:Connection,private readonly models:ProfessionalAgendaModels,readonly config:DemoConfig){
    assertDemo(config,connection.name);this.eligibility=new DemoEligibility(config,connection.name);
    const schema=new Schema<LedgerData>({_id:String,ownerId:String,professionalAuthUserId:String,currentAppointmentId:String,state:{type:String,required:true},attemptId:String,claimToken:String,serviceId:String,priceCents:Number,currency:String,serviceVersion:Number,bankApproved:{type:Boolean,default:false},free:{type:Boolean,default:false},refundPending:{type:Boolean,default:false},reconciliationRequired:{type:Boolean,default:false},version:{type:Number,default:0}},{strict:'throw',versionKey:false,collection:'agenda_demo_billing'});
    schema.add({quoteExpiresAt:Date});this.Ledger=connection.models.AgendaDemoBilling||connection.model('AgendaDemoBilling',schema);
    const event=new Schema({rootId:String,version:Number,action:String,state:String,attemptId:String,occurredAt:Date},{strict:'throw',versionKey:false,collection:'agenda_demo_billing_history'});event.index({rootId:1,version:1},{unique:true});
    this.Event=connection.models.AgendaDemoBillingHistory||connection.model('AgendaDemoBillingHistory',event);
  }
  async initialize(){await Promise.all([this.Ledger.init(),this.Event.init()]);}
  async root(doc:AppointmentData&{_id:unknown},session?:ClientSession):Promise<string>{
    if(doc.billingRootId)return doc.billingRootId;let current=doc;
    for(let i=0;current.rescheduleOfId;i++){if(i>=64)throw new ApiError(409,'BILLING_CHAIN_LIMIT','Billing lineage requires reconciliation');const parent=await this.models.Appointment.findOne({_id:current.rescheduleOfId,subjectAuthUserId:doc.subjectAuthUserId,professionalAuthUserId:doc.professionalAuthUserId}).session(session||null);if(!parent)throw new ApiError(409,'INVALID_BILLING_LINEAGE','Original appointment unavailable');if(parent.billingRootId)return parent.billingRootId;current=parent;}
    return String(current._id);
  }
  async quote(doc:AppointmentData,actorId=doc.subjectAuthUserId,quoteId?:string){if(!doc.serviceId)throw new ApiError(409,'SERVICE_ASSOCIATION_REQUIRED','Select and associate a validated professional service before payment');return this.eligibility.quote(actorId,doc.serviceId,doc.professionalId,doc.capabilityId,(doc.endAtUtc.getTime()-doc.startAtUtc.getTime())/60000,quoteId);}
  private async record(ledger:any,action:string,session:ClientSession){ledger.version++;await ledger.save({session});await this.Event.create([{rootId:ledger._id,version:ledger.version,action,state:ledger.state,attemptId:ledger.attemptId,occurredAt:new Date()}],{session});}
  async context(actorId:string,id:string){
    const a=await this.models.Appointment.findOne({_id:oid(id),subjectAuthUserId:oid(actorId)});if(!a)throw new ApiError(404,'NOT_FOUND','Owned appointment not found');const rootId=await this.root(a),ledger=await this.Ledger.findById(rootId);
    return {appointmentId:String(a._id),ownerId:a.subjectAuthUserId,professionalId:a.professionalId,capabilityId:a.capabilityId,serviceId:a.serviceId,status:a.status,version:a.version,durationMinutes:(a.endAtUtc.getTime()-a.startAtUtc.getTime())/60000,rescheduleOfId:a.rescheduleOfId,rescheduledToId:a.rescheduledToId,rootId,billing:ledger?{state:ledger.state,attemptId:ledger.attemptId,bankApproved:ledger.bankApproved,free:ledger.free,refundPending:ledger.refundPending,reconciliationRequired:ledger.reconciliationRequired,currentAppointmentId:ledger.currentAppointmentId}:null};
  }
  async associate(actorId:string,id:string,serviceId:string,version:number){
    const before=await this.models.Appointment.findOne({_id:oid(id),subjectAuthUserId:oid(actorId)});if(!before)throw new ApiError(404,'NOT_FOUND','Owned appointment not found');
    return calendarTransaction(this.connection,this.models,before.professionalAuthUserId,async session=>{
      const a=await this.models.Appointment.findOne({_id:id,subjectAuthUserId:actorId,version,status:'accepted'}).session(session);if(!a)throw new ApiError(412,'VERSION_CONFLICT','Accepted appointment version required');
      const rootId=await this.root(a,session);if(a.serviceId&&a.serviceId!==serviceId||await this.Ledger.exists({_id:rootId}).session(session))throw new ApiError(409,'SERVICE_ALREADY_BOUND','Financial service association cannot change');
      const q=await this.eligibility.quote(actorId,oid(serviceId),a.professionalId,a.capabilityId,(a.endAtUtc.getTime()-a.startAtUtc.getTime())/60000);
      a.serviceId=serviceId;a.billingRootId=rootId;a.version++;await a.save({session});const eventId=randomUUID();
      await this.models.History.create([{appointmentId:id,version:a.version,from:a.status,to:a.status,action:'service-associated',actorId,actorType:'subject',occurredAt:new Date(),reasonCode:'service_selected',eventId}],{session});
      await this.models.Outbox.create([{eventId,type:'agenda.professional.service-associated.v1',appointmentId:id,aggregateVersion:a.version,occurredAt:new Date(),status:'pending',attempts:0,nextAttemptAt:new Date()}],{session});
      return {id,serviceId,version:a.version,quote:q};
    });
  }
  async claim(body:{actorId:string;appointmentId:string;attemptId:string;appointmentVersion:number;quoteId:string}){
    const before=await this.models.Appointment.findOne({_id:oid(body.appointmentId),subjectAuthUserId:oid(body.actorId)});if(!before)throw new ApiError(404,'NOT_FOUND','Owned appointment not found');
    return calendarTransaction(this.connection,this.models,before.professionalAuthUserId,async session=>{
      const a=await this.models.Appointment.findOne({_id:body.appointmentId,subjectAuthUserId:body.actorId,status:'accepted',version:body.appointmentVersion}).session(session);if(!a)throw new ApiError(409,'APPOINTMENT_NOT_PAYABLE','An unchanged accepted appointment is required');
      const q=await this.quote(a,body.actorId,oid(body.quoteId)),rootId=await this.root(a,session);let ledger=await this.Ledger.findById(rootId).session(session);
      if(ledger&&(ledger.bankApproved||ledger.free||ledger.reconciliationRequired||['processing','unknown'].includes(ledger.state)))throw new ApiError(409,'BILLING_ALREADY_CLAIMED','Billing is settled or blocked');
      if(!ledger)ledger=new this.Ledger({_id:rootId,ownerId:body.actorId,professionalAuthUserId:a.professionalAuthUserId,currentAppointmentId:String(a._id),state:'unpaid'});
      ledger.set({state:'processing',attemptId:oid(body.attemptId),claimToken:randomUUID(),serviceId:q.serviceId,priceCents:q.priceCents,currency:q.currency,serviceVersion:q.serviceVersion,quoteExpiresAt:new Date(q.expiresAt),currentAppointmentId:String(a._id)});
      await this.record(ledger,'claim',session);return {rootId,claimToken:ledger.claimToken,quote:q};
    });
  }
  async settle(body:{actorId:string;appointmentId:string;attemptId:string;claimToken:string;outcome:string}){
    const before=await this.models.Appointment.findOne({_id:oid(body.appointmentId),subjectAuthUserId:oid(body.actorId)});if(!before)throw new ApiError(404,'NOT_FOUND','Owned appointment not found');
    if(!['approved','declined','free','unknown','expired'].includes(body.outcome))throw new ApiError(400,'INVALID_OUTCOME','Invalid mock receipt');
    return calendarTransaction(this.connection,this.models,before.professionalAuthUserId,async session=>{
      const rootId=await this.root(before,session),ledger=await this.Ledger.findOne({_id:rootId,ownerId:body.actorId,attemptId:oid(body.attemptId),claimToken:body.claimToken}).session(session);
      if(!ledger)throw new ApiError(409,'BILLING_CLAIM_REQUIRED','Matching billing claim required');
      if(ledger.state===body.outcome)return {state:ledger.state};
      if(body.outcome==='expired'&&(ledger.state!=='processing'||!ledger.quoteExpiresAt||ledger.quoteExpiresAt>new Date()))throw new ApiError(409,'INVALID_QUOTE_EXPIRY','Only an expired unexecuted claim may be released');
      if(!['processing','unknown'].includes(ledger.state))throw new ApiError(409,'BILLING_FINAL','Billing receipt already final');
      if(body.outcome==='free'&&ledger.priceCents!==0||body.outcome==='approved'&&!(ledger.priceCents>0))throw new ApiError(409,'INVALID_BANK_AMOUNT','Bank amount mismatch');
      ledger.state=body.outcome;ledger.bankApproved=body.outcome==='approved';ledger.free=body.outcome==='free';if(body.outcome==='unknown')ledger.reconciliationRequired=true;
      const current=await this.models.Appointment.findById(ledger.currentAppointmentId).session(session);if(current?.status==='cancelled'&&ledger.bankApproved)ledger.refundPending=true;
      await this.record(ledger,'receipt',session);return {state:ledger.state,refundPending:ledger.refundPending,reconciliationRequired:ledger.reconciliationRequired};
    });
  }
  async changed(doc:AppointmentData&{_id:unknown},action:string,session:ClientSession){
    if(action!=='cancelled')return;const rootId=await this.root(doc,session),l=await this.Ledger.findById(rootId).session(session);
    if(!l||l.currentAppointmentId!==String(doc._id))return;if(l.bankApproved)l.refundPending=true;if(['processing','unknown'].includes(l.state))l.reconciliationRequired=true;await this.record(l,'appointment-cancelled',session);
  }
  async accepted(doc:AppointmentData&{_id:unknown},q:Quote|undefined,session:ClientSession){
    if(!doc.rescheduleOfId)return;const rootId=await this.root(doc,session),l=await this.Ledger.findById(rootId).session(session);if(!l)return;
    l.currentAppointmentId=String(doc._id);if((l.bankApproved||l.free||['processing','unknown'].includes(l.state))&&(!q||q.serviceId!==l.serviceId||q.priceCents!==l.priceCents||q.currency!==l.currency))l.reconciliationRequired=true;
    await this.record(l,'appointment-rescheduled',session);
  }
}
