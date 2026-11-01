import { createHash, randomUUID } from 'node:crypto';
import { ClientSession, Connection, HydratedDocument } from 'mongoose';
import { AgendaModels } from '../models';
import { RequestContext } from '../middlewares/auth.middleware';
import { AppointmentData, AppointmentStatus, ExceptionData, ProfessionalAgendaModels, RuleData } from './models';
import { AppointmentEligibility, EligibilityDecision, EligibilityInput } from './eligibility';
import { availabilityWindows, subtractIntervals } from './availability';
import { calendarTransaction } from './transaction';
import { bookingInput, BookingInput, commandKey, exceptionInput, fail, invalid, object, objectId, period, ruleInput, ruleKeys } from './validation';
import { intersects, localParts } from './time';
import { AgendaBilling } from '../payment-demo/billing';
type Session = ClientSession;
type Appointment = HydratedDocument<AppointmentData>;
type Resource = { id: string; version: number } & Record<string, unknown>;
type Result = { data: Resource; replayed: boolean };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const minutes = (n: number) => n * 60000;
function ruleDto(d: HydratedDocument<RuleData>): Resource {
  return { id:String(d._id),version:d.version,professionalId:d.professionalId,capabilityId:d.capabilityId,weekday:d.weekday,localStartTime:d.localStartTime,localEndTime:d.localEndTime,
    timezone:d.timezone,sessionModes:d.sessionModes,environments:d.environments,slotDurationMinutes:d.slotDurationMinutes,bufferBeforeMinutes:d.bufferBeforeMinutes,bufferAfterMinutes:d.bufferAfterMinutes,
    validFrom:d.validFrom,validUntil:d.validUntil,dstDisambiguation:d.dstDisambiguation,active:d.active,createdAt:d.createdAt,updatedAt:d.updatedAt };
}
function exceptionDto(d: HydratedDocument<ExceptionData>): Resource {
  return { id:String(d._id),version:d.version,professionalId:d.professionalId,capabilityId:d.capabilityId,type:d.type,startAtUtc:d.startAtUtc,endAtUtc:d.endAtUtc,timezone:d.timezone,
    replacesRuleId:d.replacesRuleId,reasonCode:d.reasonCode,active:d.active,sessionModes:d.type==='block'?undefined:d.sessionModes,environments:d.type==='block'?undefined:d.environments,
    slotDurationMinutes:d.type==='block'?undefined:d.slotDurationMinutes,bufferBeforeMinutes:d.type==='block'?undefined:d.bufferBeforeMinutes,bufferAfterMinutes:d.type==='block'?undefined:d.bufferAfterMinutes,createdAt:d.createdAt,updatedAt:d.updatedAt };
}
export function appointmentDto(d: Appointment): Resource {
  return { id:String(d._id),version:d.version,serviceId:d.serviceId,appointmentType:d.appointmentType,professionalId:d.professionalId,capabilityId:d.capabilityId,relationshipId:d.relationshipId,
    mode:d.mode,environment:d.environment,startAtUtc:d.startAtUtc,endAtUtc:d.endAtUtc,timezone:d.timezone,status:d.status,expiresAtUtc:d.expiresAtUtc,
    bufferBeforeMinutes:d.bufferBeforeMinutes,bufferAfterMinutes:d.bufferAfterMinutes,rescheduleOfId:d.rescheduleOfId,rescheduledToId:d.rescheduledToId,
    acceptedAt:d.acceptedAt,closedAt:d.closedAt,reasonCode:d.reasonCode,createdAt:d.createdAt,updatedAt:d.updatedAt,sensitiveDataAuthorized:false };
}
export class ProfessionalAgendaService {
  private readonly now:()=>Date;
  private readonly databaseNow:()=>Date|string;
  constructor(private readonly connection:Connection, private readonly models:ProfessionalAgendaModels, private readonly personal:AgendaModels,
    private readonly eligibility:AppointmentEligibility, clock?:()=>Date,private readonly billing?:AgendaBilling) { this.now=clock||(()=>new Date()); this.databaseNow=clock?clock:()=>'$$NOW'; }
  private participant(actor:string) { return { $or:[{subjectAuthUserId:actor},{professionalAuthUserId:actor}] }; }
  private live(now:Date) { return { $or:[{status:'accepted'},{status:'requested',expiresAtUtc:{$gt:now}}] }; }
  private async decision(input:EligibilityInput, professionalActor?:RequestContext):Promise<EligibilityDecision> {
    const d=await this.eligibility.check(input);
    if (!d.eligible || !d.canOfferAppointment || d.capabilityId!==input.capabilityId || (input.professionalId && d.professionalId!==input.professionalId)) return fail(404,'PROFESSIONAL_INELIGIBLE','Professional capability is not eligible');
    if (professionalActor && (professionalActor.identity.userType!=='profissional' || d.professionalAuthUserId!==professionalActor.identity.id)) return fail(404,'NOT_FOUND','Professional resource not found');
    if (input.relationshipId && !d.relationshipAccepted) return fail(403,'RELATIONSHIP_REQUIRED','An accepted relationship for these participants and capability is required');
    return d;
  }
  private async resource(type:string,id:string,actor:string,session:Session):Promise<Resource> {
    if(type==='rule'){const d=await this.models.Rule.findOne({_id:id,professionalAuthUserId:actor}).session(session);if(d)return ruleDto(d);}
    if(type==='exception'){const d=await this.models.Exception.findOne({_id:id,professionalAuthUserId:actor}).session(session);if(d)return exceptionDto(d);}
    if(type==='appointment'){const d=await this.models.Appointment.findOne({_id:id,...this.participant(actor)}).session(session);if(d)return appointmentDto(d);}
    return fail(404,'NOT_FOUND','Resource not found');
  }
  private async mutate(ctx:RequestContext,owner:string,key:string,command:unknown,operation:(s:Session)=>Promise<{type:string;data:Resource}>):Promise<Result> {
    const keyHash=hash(commandKey(key)),fingerprint=hash(command);
    return calendarTransaction(this.connection,this.models,owner,async session=>{
      const previous=await this.models.Command.findOne({actorId:ctx.identity.id,keyHash}).session(session);
      if(previous){if(previous.fingerprint!==fingerprint)return fail(409,'IDEMPOTENCY_CONFLICT','Key already used for a different command');return {data:await this.resource(previous.resourceType,previous.resourceId,ctx.identity.id,session),replayed:true};}
      const result=await operation(session);
      await this.models.Command.create([{actorId:ctx.identity.id,keyHash,fingerprint,resourceType:result.type,resourceId:result.data.id}],{session});
      if(result.type!=='appointment')await this.models.Audit.create([{resourceId:result.data.id,resourceType:result.type,version:result.data.version,action:String((command as unknown[])[0]),actorId:ctx.identity.id,requestId:ctx.requestId,occurredAt:this.now()}],{session});
      return {data:result.data,replayed:false};
    });
  }
  private async audit(doc:Appointment,from:AppointmentStatus|undefined,action:string,ctx:RequestContext|undefined,session:Session) {
    const eventId=randomUUID(),now=this.now(),actorType=!ctx?'system':ctx.identity.id===doc.subjectAuthUserId?'subject':'professional';
    await this.models.History.create([{appointmentId:String(doc._id),version:doc.version,from,to:doc.status,action,actorId:ctx?.identity.id,actorType,occurredAt:now,reasonCode:doc.reasonCode||action,eventId}],{session});
    await this.models.Audit.create([{resourceId:String(doc._id),resourceType:'appointment',version:doc.version,action,actorId:ctx?.identity.id,requestId:ctx?.requestId||eventId,occurredAt:now}],{session});
    await this.models.Outbox.create([{eventId,type:'agenda.professional.'+action+'.v1',appointmentId:String(doc._id),aggregateVersion:doc.version,occurredAt:now,status:'pending',attempts:0,nextAttemptAt:now}],{session});
  }
  private async change(doc:Appointment,status:AppointmentStatus,action:string,reason:string,ctx:RequestContext|undefined,session:Session,extra:Record<string,unknown>={}) {
    const query:Record<string,unknown>={_id:doc._id,status:doc.status,version:doc.version};
    if(doc.status==='requested') {
      const expiring=status==='expired';query.expiresAtUtc=expiring?{$lte:this.now()}:{$gt:this.now()};
      query.$expr=expiring?{$lte:['$expiresAtUtc',this.databaseNow()]}:{$gt:['$expiresAtUtc',this.databaseNow()]};
    }
    if((action==='rescheduled')||(doc.status==='accepted'&&status==='cancelled'&&ctx?.identity.id===doc.subjectAuthUserId)) {
      query.startAtUtc={$gte:new Date(this.now().getTime()+86400000)};
      query.$expr={$gte:['$startAtUtc',{$add:[this.databaseNow(),86400000]}]};
    }
    const updated=await this.models.Appointment.findOneAndUpdate(query,{$set:{status,reasonCode:reason,...(status==='accepted'?{acceptedAt:this.now()}:{closedAt:this.now()}),...extra},$inc:{version:1}},{new:true,runValidators:true,session});
    if(!updated)return fail(409,'CONCURRENT_UPDATE','Appointment changed concurrently');
    await this.audit(updated,doc.status,action,ctx,session);if(this.billing)await this.billing.changed(updated,action,session);return updated;
  }
  private async ownerAppointment(ctx:RequestContext,id:string) {
    const d=await this.models.Appointment.findOne({_id:objectId(id),...this.participant(ctx.identity.id)});
    if(!d)return fail(404,'NOT_FOUND','Appointment not found');return d;
  }
  private async busy(owner:string,start:Date,end:Date,session?:Session,exclude:string[]=[]) {
    return this.models.Appointment.find({professionalAuthUserId:owner,...this.live(this.now()),occupiedStartAtUtc:{$lt:end},occupiedEndAtUtc:{$gt:start},...(exclude.length?{_id:{$nin:exclude}}:{})}).session(session||null);
  }
  private async selectedWindow(input:BookingInput,owner:string,session:Session,exclude:string[]=[]) {
    const [rules,exceptions]=await Promise.all([this.models.Rule.find({professionalAuthUserId:owner,capabilityId:input.capabilityId,active:true}).session(session),
      this.models.Exception.find({professionalAuthUserId:owner,active:true,startAtUtc:{$lt:new Date(input.endAtUtc.getTime()+2*86400000)},endAtUtc:{$gt:new Date(input.startAtUtc.getTime()-2*86400000)}}).session(session)]);
    const windows=availabilityWindows(rules,exceptions.filter(e=>e.type==='block'||e.capabilityId===input.capabilityId),input.startAtUtc,input.endAtUtc);
    const w=windows.find(w=>w.sessionModes.includes(input.mode)&&(!input.environment||w.environments.includes(input.environment))
      && w.slotDurationMinutes===(input.endAtUtc.getTime()-input.startAtUtc.getTime())/60000
      && new Date(input.startAtUtc.getTime()-minutes(w.bufferBeforeMinutes))>=w.start && new Date(input.endAtUtc.getTime()+minutes(w.bufferAfterMinutes))<=w.end);
    if(!w)return fail(409,'OUTSIDE_AVAILABILITY','Requested interval is outside professional availability');
    const start=new Date(input.startAtUtc.getTime()-minutes(w.bufferBeforeMinutes)),end=new Date(input.endAtUtc.getTime()+minutes(w.bufferAfterMinutes));
    if(exceptions.some(e=>e.type==='block'&&intersects(start,end,e.startAtUtc,e.endAtUtc))||(await this.busy(owner,start,end,session,exclude)).length)return fail(409,'SLOT_CONFLICT','Professional interval is occupied');
    return {source:w,occupiedStartAtUtc:start,occupiedEndAtUtc:end};
  }
  private permitsModes(d:EligibilityDecision,modes:string[],environments:string[]) {
    if(modes.some(m=>!d.serviceModes.includes(m) && !(m==='in_person'&&d.serviceModes.includes('home_visit')&&environments.every(e=>e==='home'))))return fail(403,'MODE_NOT_AUTHORIZED','Capability does not authorize the requested service mode');
  }
  async createRule(ctx:RequestContext,input:unknown,key:string) {
    const data=ruleInput(input),d=await this.decision({capabilityId:data.capabilityId},ctx);
    return this.mutate(ctx,d.professionalAuthUserId,key,['create-rule',data],async session=>{
      const current=await this.decision({capabilityId:data.capabilityId,professionalId:d.professionalId},ctx);this.permitsModes(current,data.sessionModes,data.environments);
      if(await this.models.Rule.countDocuments({professionalAuthUserId:d.professionalAuthUserId,active:true}).session(session)>=200)return fail(409,'RULE_LIMIT','At most 200 active rules per professional');
      const [doc]=await this.models.Rule.create([{...data,professionalId:d.professionalId,professionalAuthUserId:d.professionalAuthUserId,active:true,version:1}],{session});return {type:'rule',data:ruleDto(doc)};
    });
  }
  async updateRule(ctx:RequestContext,id:string,patch:unknown,version:number,key:string,remove=false) {
    const before=await this.models.Rule.findOne({_id:objectId(id),professionalAuthUserId:ctx.identity.id});if(!before)return fail(404,'NOT_FOUND','Rule not found');
    const fields=object(patch,ruleKeys.filter(k=>k!=='capabilityId'));if(!remove&&!Object.keys(fields).length)return invalid('At least one rule field is required');
    return this.mutate(ctx,ctx.identity.id,key,[remove?'remove-rule':'update-rule',id,version,fields],async session=>{
      const doc=await this.models.Rule.findOne({_id:id,professionalAuthUserId:ctx.identity.id}).session(session);if(!doc||!doc.active)return fail(404,'NOT_FOUND','Active rule not found');
      if(doc.version!==version)return fail(412,'VERSION_CONFLICT','Rule version does not match');const proof=await this.decision({capabilityId:doc.capabilityId,professionalId:doc.professionalId},ctx);
      if(await this.models.Appointment.exists({professionalAuthUserId:ctx.identity.id,availabilitySourceId:id,...this.live(this.now()),occupiedEndAtUtc:{$gt:this.now()}}).session(session))return fail(409,'RULE_IN_USE','Cancel affected appointments before changing their availability');
      if(await this.models.Exception.exists({professionalAuthUserId:ctx.identity.id,replacesRuleId:id,type:'replacement',active:true}).session(session))return fail(409,'RULE_HAS_REPLACEMENT','Deactivate related replacement exceptions before changing the rule');
      const editable=remove?{active:false}:ruleInput(Object.fromEntries(ruleKeys.map(k=>[k,(fields[k]!==undefined?fields[k]:(doc.toObject() as unknown as Record<string,unknown>)[k])]).filter(([,v])=>v!==undefined)));
      if(!remove){const w=editable as ReturnType<typeof ruleInput>;this.permitsModes(proof,w.sessionModes,w.environments);}
      const updated=await this.models.Rule.findOneAndUpdate({_id:id,professionalAuthUserId:ctx.identity.id,version,active:true},{$set:editable,$inc:{version:1}},{new:true,session,runValidators:true});
      if(!updated)return fail(412,'VERSION_CONFLICT','Rule version does not match');return {type:'rule',data:ruleDto(updated)};
    });
  }
  async createException(ctx:RequestContext,input:unknown,key:string) {
    const data=exceptionInput(input),d=await this.decision({capabilityId:data.capabilityId},ctx);
    return this.mutate(ctx,d.professionalAuthUserId,key,['create-exception',data],async session=>{
      const decision=await this.decision({capabilityId:data.capabilityId,professionalId:d.professionalId},ctx);if(data.type!=='block')this.permitsModes(decision,data.sessionModes,data.environments);
      if(data.startAtUtc<=this.now())return fail(422,'PAST_EXCEPTION','Availability exceptions must start in the future');
      if(data.type==='block'&&(await this.busy(d.professionalAuthUserId,data.startAtUtc,data.endAtUtc,session)).length)return fail(409,'SLOT_CONFLICT','Cancel affected appointments before blocking this interval');
      if(data.type==='replacement'){
        const rule=await this.models.Rule.findOne({_id:data.replacesRuleId,professionalAuthUserId:d.professionalAuthUserId,capabilityId:data.capabilityId,timezone:data.timezone,active:true}).session(session);
        if(!rule)return fail(404,'NOT_FOUND','Replacement rule not found');
        const day=localParts(data.startAtUtc,data.timezone).day;
        if(day<rule.validFrom||day>rule.validUntil||new Date(day).getUTCDay()!==rule.weekday)return invalid('Replacement must target an occurrence of its rule');
        const replacements=await this.models.Exception.find({professionalAuthUserId:d.professionalAuthUserId,replacesRuleId:data.replacesRuleId,type:'replacement',active:true}).session(session);
        if(replacements.some(e=>localParts(e.startAtUtc,e.timezone).day===localParts(data.startAtUtc,data.timezone).day))return fail(409,'REPLACEMENT_EXISTS','An active replacement already exists for this rule and local day');
        const existing=await this.models.Appointment.find({professionalAuthUserId:d.professionalAuthUserId,availabilitySourceId:data.replacesRuleId,...this.live(this.now())}).session(session);
        if(existing.some(a=>localParts(a.startAtUtc,data.timezone).day===localParts(data.startAtUtc,data.timezone).day))return fail(409,'RULE_IN_USE','Replacement would affect an existing reservation');
      }
      const [doc]=await this.models.Exception.create([{...data,professionalId:d.professionalId,professionalAuthUserId:d.professionalAuthUserId,active:true,version:1}],{session});return {type:'exception',data:exceptionDto(doc)};
    });
  }
  async removeException(ctx:RequestContext,id:string,version:number,key:string) {
    const before=await this.models.Exception.findOne({_id:objectId(id),professionalAuthUserId:ctx.identity.id});if(!before)return fail(404,'NOT_FOUND','Exception not found');
    return this.mutate(ctx,ctx.identity.id,key,['remove-exception',id,version],async session=>{
      const doc=await this.models.Exception.findOne({_id:id,professionalAuthUserId:ctx.identity.id,active:true}).session(session);if(!doc)return fail(404,'NOT_FOUND','Active exception not found');
      if(doc.version!==version)return fail(412,'VERSION_CONFLICT','Exception version does not match');await this.decision({capabilityId:doc.capabilityId,professionalId:doc.professionalId},ctx);
      if(doc.type!=='block'&&await this.models.Appointment.exists({professionalAuthUserId:ctx.identity.id,availabilitySourceId:id,...this.live(this.now())}).session(session))return fail(409,'RULE_IN_USE','Exception has reservations');
      doc.active=false;doc.version++;await doc.save({session});return {type:'exception',data:exceptionDto(doc)};
    });
  }
  async request(ctx:RequestContext,input:unknown,key:string,parentId?:string,parentVersion?:number) {
    if((input as {serviceId?:unknown})?.serviceId!==undefined&&!this.billing)return invalid('Service association requires the isolated payment integration');
    const data=bookingInput(input),d=await this.decision({capabilityId:data.capabilityId,professionalId:data.professionalId,subjectAuthUserId:ctx.identity.id,...(data.relationshipId?{relationshipId:data.relationshipId}:{})});
    if(d.professionalAuthUserId===ctx.identity.id)return fail(403,'SELF_BOOKING','Self-booking is forbidden');
    return this.mutate(ctx,d.professionalAuthUserId,key,['request',data,parentId||null,parentVersion||null],async session=>{
      const now=this.now();let parent:Appointment|null=null;
      if(parentId){parent=await this.models.Appointment.findOne({_id:parentId,subjectAuthUserId:ctx.identity.id}).session(session);if(!parent)return fail(404,'NOT_FOUND','Original appointment not found');
        if(parent.version!==parentVersion)return fail(412,'VERSION_CONFLICT','Original version does not match');
        if(parent.status!=='accepted'||parent.startAtUtc.getTime()-now.getTime()<86400000)return fail(409,'RESCHEDULE_CUTOFF','Original appointment cannot be rescheduled');
        if(parent.professionalId!==data.professionalId||parent.capabilityId!==data.capabilityId||parent.appointmentType!==data.appointmentType||parent.relationshipId!==data.relationshipId)return invalid('Rescheduling preserves the original participants, type, capacity and relationship');
        if(this.billing&&data.serviceId===undefined&&parent.serviceId)data.serviceId=parent.serviceId;
        if(await this.models.Appointment.exists({rescheduleOfId:parentId,status:'requested',expiresAtUtc:{$gt:now}}).session(session))return fail(409,'RESCHEDULE_PENDING','An active reschedule request already exists');
      }
      const current=await this.decision({capabilityId:data.capabilityId,professionalId:data.professionalId,subjectAuthUserId:ctx.identity.id,...(data.relationshipId?{relationshipId:data.relationshipId}:{})});
      if(current.professionalAuthUserId!==d.professionalAuthUserId)return fail(409,'PROFESSIONAL_CHANGED','Professional identity changed');this.permitsModes(current,[data.mode],data.environment?[data.environment]:[]);
      const checkedNow=this.now(),expiry=new Date(Math.min(checkedNow.getTime()+86400000,data.startAtUtc.getTime()-3600000,parent?parent.startAtUtc.getTime()-86400000:Infinity));
      if(expiry<=checkedNow)return fail(422,'REQUEST_WINDOW_CLOSED','Request expiry must be in the future');
      if(this.billing&&data.serviceId)await this.billing.eligibility.quote(ctx.identity.id,data.serviceId,data.professionalId,data.capabilityId,(data.endAtUtc.getTime()-data.startAtUtc.getTime())/60000);
      const slot=await this.selectedWindow(data,d.professionalAuthUserId,session,parentId?[parentId]:[]);
      if(expiry<=this.now())return fail(422,'REQUEST_WINDOW_CLOSED','Request window elapsed during validation');
      const [doc]=await this.models.Appointment.create([{...data,subjectAuthUserId:ctx.identity.id,professionalAuthUserId:d.professionalAuthUserId,occupiedStartAtUtc:slot.occupiedStartAtUtc,occupiedEndAtUtc:slot.occupiedEndAtUtc,
        availabilitySourceId:slot.source.sourceId,bufferBeforeMinutes:slot.source.bufferBeforeMinutes,bufferAfterMinutes:slot.source.bufferAfterMinutes,
        expiresAtUtc:expiry,status:'requested',version:1,createdAt:checkedNow,updatedAt:checkedNow,...(parentId?{rescheduleOfId:parentId,...(this.billing&&parent?{billingRootId:await this.billing.root(parent,session)}:{})}:{})}],{session});
      await this.audit(doc,undefined,'requested',ctx,session);return {type:'appointment',data:appointmentDto(doc)};
    });
  }
  private async expireOne(id:string,owner:string) {
    return calendarTransaction(this.connection,this.models,owner,async session=>{
      const doc=await this.models.Appointment.findOne({_id:id,professionalAuthUserId:owner,status:'requested',expiresAtUtc:{$lte:this.now()}}).session(session);
      if(doc)await this.change(doc,'expired','expired','request_expired',undefined,session);
    });
  }
  async expireDue(limit=50) {
    const due=await this.models.Appointment.find({status:'requested',expiresAtUtc:{$lte:this.now()}}).sort({expiresAtUtc:1}).limit(limit);
    for(const d of due)await this.expireOne(String(d._id),d.professionalAuthUserId);return due.length;
  }
  async transition(ctx:RequestContext,id:string,action:'accept'|'decline'|'cancel'|'complete',version:number,key:string,body:unknown) {
    let before=await this.ownerAppointment(ctx,id);const professional=ctx.identity.id===before.professionalAuthUserId;
    const d=object(body,['reasonCode']);
    if(action==='accept'||action==='complete'){if(Object.keys(d).length)return invalid('Empty command body required');}
    const reasons=['professional_unavailable','client_request','scheduling_change','eligibility_lost'];
    if((action==='decline'||(action==='cancel'&&professional))&&!reasons.includes(String(d.reasonCode)))return invalid('Structured professional reason code required');
    if(!professional&&d.reasonCode!==undefined)return invalid('Subject cancellation uses an empty body');
    if(before.status==='requested'&&before.expiresAtUtc<=this.now()){await this.expireOne(id,before.professionalAuthUserId);before=await this.ownerAppointment(ctx,id);}
    const result=await this.mutate(ctx,before.professionalAuthUserId,key,[action,id,version,d],async session=>{
      const doc=await this.models.Appointment.findOne({_id:id,...this.participant(ctx.identity.id)}).session(session);if(!doc)return fail(404,'NOT_FOUND','Appointment not found');
      if(doc.version!==version)return fail(412,'VERSION_CONFLICT','Appointment version does not match');
      const now=this.now();
      if(doc.status==='requested'&&doc.expiresAtUtc<=now){const expired=await this.change(doc,'expired','expired','request_expired',undefined,session);return {type:'appointment',data:appointmentDto(expired)};}
      if(!['requested','accepted'].includes(doc.status))return fail(409,'APPOINTMENT_FINAL','Final appointments cannot change');
      if(action==='accept'||action==='decline'){
        if(!professional||ctx.identity.userType!=='profissional')return fail(403,'PROFESSIONAL_REQUIRED','Only the targeted professional can resolve a request');
        if(doc.status!=='requested')return fail(409,'INVALID_TRANSITION','Only requested appointments may be accepted or declined');
        const proof=await this.decision({capabilityId:doc.capabilityId,professionalId:doc.professionalId,subjectAuthUserId:doc.subjectAuthUserId,...(action==='accept'&&doc.relationshipId?{relationshipId:doc.relationshipId}:{})},ctx);
        this.permitsModes(proof,[doc.mode],doc.environment?[doc.environment]:[]);
        if(doc.expiresAtUtc<=this.now()){const expired=await this.change(doc,'expired','expired','request_expired',undefined,session);return {type:'appointment',data:appointmentDto(expired)};}
      }
      let updated:Appointment;
      if(action==='accept'){
        const quote=this.billing&&doc.serviceId?await this.billing.quote(doc):undefined;
        let parent:Appointment|null=null;if(doc.rescheduleOfId){parent=await this.models.Appointment.findOne({_id:doc.rescheduleOfId,subjectAuthUserId:doc.subjectAuthUserId,professionalAuthUserId:doc.professionalAuthUserId}).session(session);
          if(!parent||parent.status!=='accepted'||parent.startAtUtc.getTime()-this.now().getTime()<86400000)return fail(409,'RESCHEDULE_CUTOFF','Original appointment can no longer be replaced');}
        await this.selectedWindow({...doc.toObject(),professionalId:doc.professionalId} as BookingInput,doc.professionalAuthUserId,session,[id,...(parent?[String(parent._id)]:[])]);
        updated=await this.change(doc,'accepted','accepted','professional_accepted',ctx,session);
        if(parent){await this.change(parent,'cancelled','rescheduled','rescheduled',ctx,session,{rescheduledToId:id});}
        if(this.billing)await this.billing.accepted(updated,quote,session);
      }else if(action==='decline')updated=await this.change(doc,'declined','declined',String(d.reasonCode),ctx,session);
      else if(action==='complete'){
        if(!professional||ctx.identity.userType!=='profissional')return fail(403,'PROFESSIONAL_REQUIRED','Only the targeted professional may complete an appointment');
        if(doc.status!=='accepted'||doc.endAtUtc>this.now())return fail(409,'INVALID_TRANSITION','Only accepted appointments whose end has passed may be completed');
        updated=await this.change(doc,'completed','completed','professional_completed',ctx,session);
      }else{
        if(!professional&&doc.status==='accepted'&&doc.startAtUtc.getTime()-now.getTime()<86400000)return fail(409,'CANCELLATION_CUTOFF','Subject cancellation requires at least 24 hours notice');
        updated=await this.change(doc,'cancelled','cancelled',professional?String(d.reasonCode):'subject_cancelled',ctx,session);
        const children=await this.models.Appointment.find({rescheduleOfId:id,status:'requested'}).session(session);
        for(const child of children)await this.change(child,child.expiresAtUtc<=this.now()?'expired':'cancelled',child.expiresAtUtc<=this.now()?'expired':'cancelled','original_cancelled',ctx,session);
      }
      return {type:'appointment',data:appointmentDto(updated)};
    });
    if(result.data.status==='expired')return fail(409,'REQUEST_EXPIRED','Request has expired');return result;
  }
  async get(ctx:RequestContext,id:string) {
    let d=await this.ownerAppointment(ctx,id);if(d.status==='requested'&&d.expiresAtUtc<=this.now()){await this.expireOne(id,d.professionalAuthUserId);d=await this.ownerAppointment(ctx,id);}
    const warnings=await this.personal.Activity.find({authUserId:ctx.identity.id,status:{$ne:'cancelled'},startAt:{$lt:d.endAtUtc},endAt:{$gt:d.startAtUtc}}).select('_id').limit(20);
    return {...appointmentDto(d),personalAgendaOverlapIds:warnings.map(v=>String(v._id)),personalOverlapAdvisory:true};
  }
  async history(ctx:RequestContext,id:string) {
    await this.ownerAppointment(ctx,id);const events=await this.models.History.find({appointmentId:id}).sort({version:1}).limit(100);
    return {items:events.map(e=>({version:e.version,from:e.from,to:e.to,action:e.action,actorType:e.actorType,occurredAt:e.occurredAt,reasonCode:e.reasonCode}))};
  }
  async list(ctx:RequestContext,query:unknown,professional=false,kind:'appointments'|'rules'|'exceptions'='appointments') {
    const q=object(query,['limit','before','status','from','to','capabilityId']);if(Object.values(q).some(v=>typeof v!=='string'))return invalid('Query parameters must be individual strings');
    if(q.limit!==undefined&&!/^[1-9]\d{0,2}$/.test(String(q.limit)))return invalid('Invalid limit');const limit=q.limit===undefined?20:Number(q.limit);
    if(!Number.isInteger(limit)||limit<1||limit>100)return invalid('limit must be 1-100');const before=q.before?objectId(q.before):undefined;
    const filter:Record<string,unknown>=professional?{professionalAuthUserId:ctx.identity.id}:{subjectAuthUserId:ctx.identity.id};
    if(before)filter._id={$lt:before};if(q.capabilityId)filter.capabilityId=objectId(q.capabilityId);
    if(kind!=='appointments'){
      if(ctx.identity.userType!=='profissional')return fail(403,'PROFESSIONAL_REQUIRED','Professional role required');
      if(q.status!==undefined||q.from!==undefined||q.to!==undefined)return invalid('Unsupported availability listing filter');
      if(kind==='rules'){const rows=await this.models.Rule.find(filter).sort({_id:-1}).limit(limit+1);return {items:rows.slice(0,limit).map(ruleDto),nextBefore:rows.length>limit?String(rows[limit-1]._id):null};}
      const rows=await this.models.Exception.find(filter).sort({_id:-1}).limit(limit+1);return {items:rows.slice(0,limit).map(exceptionDto),nextBefore:rows.length>limit?String(rows[limit-1]._id):null};
    }
    if(q.status!==undefined){if(!['requested','accepted','declined','cancelled','expired','completed'].includes(String(q.status)))return invalid('Invalid appointment status');filter.status=q.status;}
    if(q.from!==undefined||q.to!==undefined){const p=period(q);filter.startAtUtc={$lt:p.to};filter.endAtUtc={$gt:p.from};}
    const due=await this.models.Appointment.find({... (professional?{professionalAuthUserId:ctx.identity.id}:{subjectAuthUserId:ctx.identity.id}),status:'requested',expiresAtUtc:{$lte:this.now()}}).limit(50);
    for(const d of due)await this.expireOne(String(d._id),d.professionalAuthUserId);
    const rows=await this.models.Appointment.find(filter).sort({_id:-1}).limit(limit+1);
    return {items:rows.slice(0,limit).map(appointmentDto),nextBefore:rows.length>limit?String(rows[limit-1]._id):null};
  }
  async availability(ctx:RequestContext,professionalId:string,query:unknown) {
    const q=object(query,['capabilityId','from','to','mode','environment']);if(Object.values(q).some(v=>typeof v!=='string'))return invalid('Query parameters must be individual strings');
    const p=period(q),capabilityId=objectId(q.capabilityId),proof=await this.decision({professionalId:objectId(professionalId),capabilityId});
    if(q.mode!==undefined&&!['online','in_person'].includes(String(q.mode)))return invalid('Invalid mode');if(q.environment!==undefined&&!['home','gym','outdoor'].includes(String(q.environment)))return invalid('Invalid environment');
    const [rules,exceptions,occupied]=await Promise.all([this.models.Rule.find({professionalAuthUserId:proof.professionalAuthUserId,capabilityId,active:true}),
      this.models.Exception.find({professionalAuthUserId:proof.professionalAuthUserId,active:true,startAtUtc:{$lt:new Date(p.to.getTime()+2*86400000)},endAtUtc:{$gt:new Date(p.from.getTime()-2*86400000)}}),this.busy(proof.professionalAuthUserId,p.from,p.to)]);
    const windows=availabilityWindows(rules,exceptions.filter(e=>e.type==='block'||e.capabilityId===capabilityId),p.from,p.to),busy=[...occupied.map(a=>({start:a.occupiedStartAtUtc,end:a.occupiedEndAtUtc})),...exceptions.filter(e=>e.type==='block').map(e=>({start:e.startAtUtc,end:e.endAtUtc}))];
    const result=windows.flatMap(w=>{
      const sessionModes=w.sessionModes.filter(m=>proof.serviceModes.includes(m)||(m==='in_person'&&proof.serviceModes.includes('home_visit')&&w.environments.includes('home')));
      const environments=proof.serviceModes.includes('in_person')?w.environments:w.environments.filter(e=>e==='home'&&proof.serviceModes.includes('home_visit'));
      if(!sessionModes.length||q.mode&&!sessionModes.includes(String(q.mode))||q.environment&&!environments.includes(String(q.environment)))return [];
      const start=new Date(Math.max(p.from.getTime(),w.start.getTime(),this.now().getTime()+3600001)),end=new Date(Math.min(p.to.getTime(),w.end.getTime()));
      return subtractIntervals(start,end,busy).filter(r=>r.end.getTime()-r.start.getTime()>=minutes(w.slotDurationMinutes+w.bufferBeforeMinutes+w.bufferAfterMinutes)).map(r=>({availabilitySourceId:w.sourceId,startAtUtc:new Date(r.start.getTime()+minutes(w.bufferBeforeMinutes)),endAtUtc:new Date(r.end.getTime()-minutes(w.bufferAfterMinutes)),timezone:w.timezone,sessionModes,environments,slotDurationMinutes:w.slotDurationMinutes,bufferBeforeMinutes:w.bufferBeforeMinutes,bufferAfterMinutes:w.bufferAfterMinutes}));
    });
    return {professionalId,capabilityId,items:result.slice(0,500),truncated:result.length>500,advisory:true,sensitiveDataAuthorized:false};
  }
}
