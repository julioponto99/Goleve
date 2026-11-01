import express, { Router } from 'express';
import { Connection, Schema } from 'mongoose';
import { ApiError } from '../config/errors';
import { ProfessionalModels } from '../models';
import { DemoConfig, Quote, assertDemo, authenticateInternal, fields, oid, responseProof } from './protocol';
export function createPaymentDemoRoutes(connection:Connection,models:ProfessionalModels,config:DemoConfig) {
  assertDemo(config,connection.name);
  const Quotation=connection.models.DemoPaymentQuote||connection.model('DemoPaymentQuote',new Schema({actorId:String,serviceId:String,professionalId:String,capabilityId:String,priceCents:Number,currency:String,serviceVersion:Number,durationMinutes:Number,expiresAt:Date},{strict:'throw',versionKey:false,collection:'professional_demo_payment_quotes'}));
  const r=Router();r.use(express.json({limit:'8kb'}));
  r.post('/:operation',async(req,res,next)=>{try{
    const operation=req.params.operation;if(!['eligibility','quote'].includes(operation))throw new ApiError(404,'NOT_FOUND','Contract not found');
    const caller=operation==='eligibility'?'agenda':req.get('x-demo-caller');
    if(caller!=='agenda'&&caller!=='payment')throw new ApiError(401,'INVALID_CALLER','Invalid internal caller');
    const path='/internal/v1/payment-demo/'+operation;
    await authenticateInternal(connection,config,caller,path,req.body,req.get('authorization'));
    const b=fields(req.body,operation==='quote'?['actorId','serviceId','professionalId','capabilityId','durationMinutes','quoteId']:['capabilityId','professionalId','subjectAuthUserId','relationshipId']);
    const cap=await models.Capability.findOne({_id:oid(b.capabilityId),status:{$nin:['suspended','expired','rejected']},...(b.professionalId?{professionalId:oid(b.professionalId)}:{})});
    const profile=cap&&await models.Profile.findOne({_id:cap.professionalId,authUserId:cap.authUserId,profileStatus:{$nin:['suspended','archived']}});
    const approved=profile&&await models.Application.exists({professionalId:profile._id,authUserId:profile.authUserId,status:'approved',publicationEnabled:true});
    const service=approved&&await models.Service.findOne({professionalId:profile!._id,capabilityId:cap!._id,authUserId:profile!.authUserId,category:cap!.kind,active:true,...(operation==='quote'?{_id:oid(b.serviceId)}:{})});
    if(!cap||!profile||!approved||!service)throw new ApiError(404,'DEMO_PROFESSIONAL_INELIGIBLE','Approved synthetic professional service required');
    let data:unknown;
    if(operation==='eligibility'){
      let relationshipAccepted=false;
      if(b.relationshipId)relationshipAccepted=!!await models.Relationship.exists({_id:oid(b.relationshipId),subjectAuthUserId:oid(b.subjectAuthUserId),professionalAuthUserId:profile.authUserId,professionalId:profile._id,capabilityId:cap._id,status:'accepted',relationshipKind:cap.kind==='personal_trainer'?'personal_training':'nutrition'});
      const now=Date.now();data={capabilityId:String(cap._id),professionalId:String(profile._id),professionalAuthUserId:profile.authUserId,relationshipKind:cap.kind==='personal_trainer'?'personal_training':'nutrition',eligible:true,canOfferAppointment:true,authority:'synthetic',serviceModes:cap.serviceModes,relationshipAccepted,checkedAtUtc:new Date(now).toISOString(),validUntilUtc:new Date(now+10000).toISOString()};
    }else{
      const actorId=oid(b.actorId);if(service.durationMinutes!==b.durationMinutes)throw new ApiError(409,'SERVICE_DURATION_MISMATCH','Service duration does not match the appointment');
      let q;
      if(b.quoteId){q=await Quotation.findOne({_id:oid(b.quoteId),actorId,serviceId:String(service._id),professionalId:String(profile._id),capabilityId:String(cap._id),durationMinutes:b.durationMinutes,expiresAt:{$gt:new Date()}});if(!q)throw new ApiError(410,'QUOTE_EXPIRED','Quotation is missing or expired');}
      else q=await Quotation.create({actorId,serviceId:String(service._id),professionalId:String(profile._id),capabilityId:String(cap._id),priceCents:Math.round(service.priceEur*100),currency:'EUR',serviceVersion:service.version,durationMinutes:service.durationMinutes,expiresAt:new Date(Date.now()+900000)});
      data={quoteId:String(q._id),serviceId:q.serviceId,professionalId:q.professionalId,capabilityId:q.capabilityId,priceCents:q.priceCents,currency:q.currency,serviceVersion:q.serviceVersion,durationMinutes:q.durationMinutes,expiresAt:q.expiresAt.toISOString(),authority:'synthetic'} satisfies Quote;
    }
    res.set('Cache-Control','no-store').set('x-payment-demo-proof',responseProof(config,caller,data,req.get('authorization')!)).json(data);
  }catch(e){next(e);}});return r;
}
