import { Connection } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { MockBankProvider } from '../services/mock-bank.provider';
import { DemoClient,DemoConfig,Quote,assertDemo,oid,validQuote } from './protocol';
import { integratedPaymentModel } from './models';
import { notificationTransition, MAX_OUTBOX_EVENTS } from '../events/outbox';
interface Context {appointmentId:string;ownerId:string;rootId:string;serviceId?:string;professionalId:string;capabilityId:string;status:string;version:number;durationMinutes:number;billing:null|{state:string;attemptId?:string;bankApproved:boolean;free:boolean;refundPending:boolean;reconciliationRequired:boolean;currentAppointmentId:string}}
const event=(state:string,reason:string)=>({state,reason,occurredAt:new Date()});
export class IntegratedPaymentService {
  readonly Model;readonly client:DemoClient;
  constructor(connection:Connection,readonly config:DemoConfig,private readonly bank=new MockBankProvider()){
    assertDemo(config,connection.name);this.Model=integratedPaymentModel(connection);this.client=new DemoClient(config);
  }
  private key(key:string){if(!/^[A-Za-z0-9._-]{8,128}$/.test(key))throw new ApiError(400,'INVALID_IDEMPOTENCY_KEY','Idempotency-Key required');return key;}
  private dto(p:any){return{id:String(p._id),appointmentId:p.appointmentId,serviceId:p.serviceId,quote:p.quote,state:p.state,method:'mock',transactionReference:p.transactionReference,refundPending:p.refundPending,reconciliationRequired:p.reconciliationRequired,settledAppointmentId:p.settledAppointmentId,version:p.version,history:p.history};}
  private async owned(ctx:RequestContext,id:string){const p=await this.Model.findOne({_id:oid(id),ownerId:ctx.identity.id});if(!p)throw new ApiError(404,'NOT_FOUND','Owned appointment payment not found');return p;}
  private async context(ctx:RequestContext,id:string){const c=await this.client.call<Context>('agenda','context',{actorId:ctx.identity.id,appointmentId:oid(id)});if(!c||c.ownerId!==ctx.identity.id||c.appointmentId!==id||!/^[a-f0-9]{24}$/.test(c.rootId)||!Number.isSafeInteger(c.version))throw new ApiError(403,'INVALID_APPOINTMENT_CONTEXT','Authenticated owned context required');return c;}
  async create(ctx:RequestContext,appointmentId:string,key:string){
    this.key(key);oid(appointmentId);const previous=await this.Model.findOne({ownerId:ctx.identity.id,idempotencyKey:key});
    if(previous){if(previous.appointmentId!==appointmentId)throw new ApiError(409,'IDEMPOTENCY_CONFLICT','Key belongs to another appointment');return this.get(ctx,String(previous._id));}
    const c=await this.context(ctx,appointmentId);if(c.status!=='accepted')throw new ApiError(409,'APPOINTMENT_NOT_ACCEPTED','Only accepted appointments may be paid');
    if(!c.serviceId)throw new ApiError(409,'SERVICE_ASSOCIATION_REQUIRED','A validated professional service must be associated first');
    if(c.billing?.reconciliationRequired)throw new ApiError(409,'BILLING_RECONCILIATION_REQUIRED','Billing is blocked pending reconciliation');
    const active=await this.Model.findOne({rootId:c.rootId,state:{$in:['pending','processing','approved','free','unknown']}});
    if(active){if(active.ownerId!==ctx.identity.id)throw new ApiError(409,'BILLING_CONFLICT','Billing already exists');if(['approved','free'].includes(active.state))return this.get(ctx,String(active._id));throw new ApiError(409,'PAYMENT_ALREADY_EXISTS','Resolve the existing payment before another attempt');}
    const expected={serviceId:c.serviceId,professionalId:c.professionalId,capabilityId:c.capabilityId,durationMinutes:c.durationMinutes};
    const q=validQuote(await this.client.call<Quote>('professional','quote',{actorId:ctx.identity.id,...expected}),expected);
    try {const p=await this.Model.create({ownerId:ctx.identity.id,appointmentId,rootId:c.rootId,serviceId:q.serviceId,quote:q,state:'pending',idempotencyKey:key,history:[event('pending','authenticated_quote')]});return this.dto(p);}
    catch(e){if((e as {code?:number}).code===11000){const p=await this.Model.findOne({ownerId:ctx.identity.id,idempotencyKey:key,appointmentId});if(p)return this.dto(p);throw new ApiError(409,'PAYMENT_ALREADY_EXISTS','Concurrent appointment payment already exists');}throw e;}
  }
  async get(ctx:RequestContext,id:string){
    let p=await this.owned(ctx,id);
    if(p.state==='processing'&&p.processingStartedAt&&p.processingStartedAt.getTime()+60000<=Date.now())p=await notificationTransition(this.Model,{_id:p._id,state:'processing',version:p.version},{$set:{state:'unknown',reconciliationRequired:true},$inc:{version:1},$push:{history:event('unknown','interrupted_confirmation')}},'unknown')||await this.owned(ctx,id);
    const c=await this.context(ctx,p.appointmentId),b=c.billing,requiresReconciliation=p.state==='unknown'||!!b?.reconciliationRequired;
    if(b&&b.attemptId===String(p._id)&&(p.refundPending!==b.refundPending||p.reconciliationRequired!==requiresReconciliation||p.settledAppointmentId!==b.currentAppointmentId)){
      p=await this.Model.findOneAndUpdate({_id:p._id,ownerId:ctx.identity.id,version:p.version},{$set:{refundPending:b.refundPending,reconciliationRequired:requiresReconciliation,settledAppointmentId:b.currentAppointmentId},$inc:{version:1},$push:{history:event(p.state,'agenda_billing_context_updated')}},{new:true})||await this.owned(ctx,id);
    }
    return this.dto(p);
  }
  async confirm(ctx:RequestContext,id:string,key:string){
    this.key(key);const before=await this.owned(ctx,id);
    if(before.state!=='pending'){if(before.confirmationKey===key)return this.get(ctx,id);throw new ApiError(409,'PAYMENT_ALREADY_RESOLVED','No repeated bank authorization is permitted');}
    if((before.notificationOutbox?.length||0)>MAX_OUTBOX_EVENTS-3)throw new ApiError(503,'NOTIFICATION_OUTBOX_FULL','Recover retained notification events before authorizing a bank call');
    const p=await this.Model.findOneAndUpdate({_id:before._id,ownerId:ctx.identity.id,state:'pending'},{$set:{state:'processing',confirmationKey:key,processingStartedAt:new Date()},$inc:{version:1},$push:{history:event('processing','bank_claim_intent')}},{new:true});
    if(!p)throw new ApiError(409,'PAYMENT_IN_PROGRESS','Concurrent confirmation is in progress');
    let claimToken:string|undefined,state='unknown',transactionReference:string|undefined,reason='integration_outcome_unknown',bankInvoked=false;
    try{
      const c=await this.context(ctx,p.appointmentId);if(c.status!=='accepted'||c.serviceId!==p.serviceId||c.rootId!==p.rootId)throw new ApiError(409,'APPOINTMENT_CHANGED','Accepted appointment association changed');
      validQuote(p.quote,{serviceId:p.serviceId,professionalId:c.professionalId,capabilityId:c.capabilityId,durationMinutes:c.durationMinutes});
      const grant=await this.client.call<{claimToken:string;rootId:string;quote:Quote}>('agenda','claim',{actorId:ctx.identity.id,appointmentId:p.appointmentId,attemptId:id,appointmentVersion:c.version,quoteId:p.quote.quoteId});
      if(grant.rootId!==p.rootId||!grant.claimToken||JSON.stringify(grant.quote)!==JSON.stringify(p.quote))throw new ApiError(503,'INVALID_BILLING_GRANT','Authenticated claim and quotation must match');
      claimToken=grant.claimToken;await this.Model.updateOne({_id:p._id,state:'processing'},{$set:{claimToken}});
      validQuote(p.quote,{serviceId:p.serviceId,professionalId:c.professionalId,capabilityId:c.capabilityId,durationMinutes:c.durationMinutes});
      if(p.quote.priceCents===0)state='free';
      else{
        const outcome=process.env.PAYMENT_DEMO_BANK_OUTCOME||'approve';if(!['approve','decline'].includes(outcome))throw new Error('Invalid mock bank configuration');
        let timer:ReturnType<typeof setTimeout>|undefined;
        try{bankInvoked=true;const result=await Promise.race([this.bank.authorize(id,{reference:p.serviceId,amountCents:p.quote.priceCents,outcome:outcome as 'approve'|'decline'}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Mock bank result unknown')),2000);})]);if(!result||!['approve','decline'].includes(result.outcome)||typeof result.transactionReference!=='string'||!/^mock_[A-Za-z0-9_:-]{1,100}$/.test(result.transactionReference))throw new Error('Invalid mock bank receipt');state=result.outcome==='approve'?'approved':'declined';transactionReference=result.transactionReference;}finally{if(timer)clearTimeout(timer);}
      }
      await this.client.call('agenda','settle',{actorId:ctx.identity.id,appointmentId:p.appointmentId,attemptId:id,claimToken,outcome:state});reason='mock_bank_receipt';
    }catch(e){
      if(!bankInvoked&&e instanceof ApiError&&e.code==='INVALID_OR_EXPIRED_QUOTE'){state='expired';reason=e.code;if(claimToken)try{await this.client.call('agenda','settle',{actorId:ctx.identity.id,appointmentId:p.appointmentId,attemptId:id,claimToken,outcome:'expired'});}catch{state='unknown';reason='reconciliation_required';}}
      else if(!claimToken&&e instanceof ApiError&&e.status<500){state='failed';reason=e.code;}
      else{state='unknown';reason='reconciliation_required';if(claimToken)await this.client.call('agenda','settle',{actorId:ctx.identity.id,appointmentId:p.appointmentId,attemptId:id,claimToken,outcome:'unknown'}).catch(()=>undefined);}
    }
    await notificationTransition(this.Model,{_id:p._id,state:'processing',confirmationKey:key},{$set:{state,...(transactionReference?{transactionReference}:{}),reconciliationRequired:state==='unknown'},$inc:{version:1},$push:{history:event(state,reason)}},state);
    return this.get(ctx,id);
  }
  async cancel(ctx:RequestContext,id:string,key:string){
    this.key(key);const p=await this.owned(ctx,id);if(p.state==='cancelled'&&p.confirmationKey===key)return this.get(ctx,id);
    const updated=await notificationTransition(this.Model,{_id:p._id,ownerId:ctx.identity.id,state:'pending'},{$set:{state:'cancelled',confirmationKey:key},$inc:{version:1},$push:{history:event('cancelled','owner_cancelled_pending_payment')}},'cancelled');
    if(!updated)throw new ApiError(409,'PAYMENT_NOT_CANCELLABLE','Processing or settled payments cannot be cancelled');return this.dto(updated);
  }
  async reconcile(ctx:RequestContext,id:string){
    const p=await this.owned(ctx,id),c=await this.context(ctx,p.appointmentId),b=c.billing;
    if(p.state!=='unknown'||!b||b.attemptId!==id||!['approved','declined','free'].includes(b.state))throw new ApiError(409,'BILLING_RECONCILIATION_REQUIRED','No conclusive persisted mock receipt is available; bank authorization must not be repeated');
    await notificationTransition(this.Model,{_id:p._id,state:'unknown'},{$set:{state:b.state,reconciliationRequired:b.reconciliationRequired,refundPending:b.refundPending},$inc:{version:1},$push:{history:event(b.state,'persisted_agenda_receipt_reconciled')}},b.state);return this.get(ctx,id);
  }
}
