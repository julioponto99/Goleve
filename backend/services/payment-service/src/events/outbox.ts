import { localDemo } from '../local-demo';
import { randomUUID } from 'node:crypto';
import amqp from 'amqplib';
import { Schema } from 'mongoose';
import { ApiError } from '../config/errors';

export const MAX_OUTBOX_EVENTS = 16;
export const notificationOutboxSchema = new Schema({
  eventId: String, type: String, recipientUserId: String, paymentId: String, appointmentId: String,
  version: Number, occurredAt: Date, status: { type: String, enum: ['pending','publishing','published','dead'] },
  attempts: Number, nextAttemptAt: Date, leaseId: String, lockedUntil: Date, publishedAt: Date, lastErrorCode: String,
}, { _id: false, strict: 'throw' });
export const outboxFields = { notificationVersion: { type: Number, default: 0 }, notificationOutbox: { type: [notificationOutboxSchema], default: [], validate: (events: unknown[]) => events.length <= MAX_OUTBOX_EVENTS } };

// State and event are committed by ONE document update, also on standalone MongoDB.
export async function notificationTransition(Model: any, filter: any, update: any, state: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await Model.findOne(filter); if (!current) return null;
    await Model.updateOne({ _id: current._id }, { $pull: { notificationOutbox: { status: 'published', publishedAt: { $lte: new Date(Date.now()-86400000) } } } });
    const version = current.notificationVersion || 0;
    const type = ['approved','declined','cancelled','unknown','free'].includes(state) ? 'payment.simulated.'+state+'.v1' : undefined;
    const guarded = { $and: [filter, { $expr: { $eq: [{ $ifNull: ['$notificationVersion',0] }, version] } }, ...(type ? [{ $expr: { $lt: [{ $size: { $ifNull: ['$notificationOutbox',[]] } }, MAX_OUTBOX_EVENTS] } }] : [])] };
    const changes = { ...update, $inc: { ...update.$inc, ...(type ? { notificationVersion: 1 } : {}) }, $push: { ...update.$push } };
    if(type) changes.$push.notificationOutbox = { eventId: randomUUID(), type, recipientUserId: current.ownerId, paymentId: String(current._id), ...(current.appointmentId ? { appointmentId: current.appointmentId } : {}), version: version+1, occurredAt: new Date(), status: 'pending', attempts: 0, nextAttemptAt: new Date() };
    const result = await Model.updateOne(guarded, changes);
    if(result.modifiedCount) return Model.findById(current._id);
    if(type && await Model.exists({ _id: current._id, ['notificationOutbox.'+(MAX_OUTBOX_EVENTS-1)]: { $exists: true } })) throw new ApiError(503,'NOTIFICATION_OUTBOX_FULL','Retained notification events require recovery before another transition');
  }
  throw new ApiError(409,'CONCURRENT_UPDATE','Payment changed concurrently');
}

export function assertNotificationDemo(database: string) {
  if(!['development','test'].includes(process.env.NODE_ENV || '') || !/^goleve_(payagenda_[a-f0-9]{16}_payment|notification59_[a-f0-9]+_payment)$/.test(database)&&!localDemo.permitsDemoDatabase('payment',database)) throw new Error('Payment notification publishing requires an isolated local demo');
}
export async function publishPaymentOutbox(Model: any, url: string, limit = 20) {
  assertNotificationDemo(Model.db.name);
  const connection = await amqp.connect(url, { timeout: 3000 });
  connection.on?.('error',()=>undefined);
  try {
    const channel = await connection.createConfirmChannel();
    channel.on('error',()=>undefined);
    try {
      await channel.assertExchange('goleve.notifications','topic',{ durable:true });
      await channel.assertQueue('goleve.notification-service.events',{ durable:true,deadLetterExchange:'goleve.notifications.retry',deadLetterRoutingKey:'retry' });
      await channel.bindQueue('goleve.notification-service.events','goleve.notifications','event');
      const expiredPublished={status:'published',publishedAt:{$lte:new Date(Date.now()-86400000)}};
      await Model.updateMany({notificationOutbox:{$elemMatch:expiredPublished}},{$pull:{notificationOutbox:expiredPublished}});
      let published=0;
      for(let i=0;i<limit;i++) {
        const now=new Date(), leaseId=randomUUID();
        const eligible={ status:{$in:['pending','publishing']}, attempts:{$lt:8}, nextAttemptAt:{$lte:now}, $or:[{lockedUntil:{$exists:false}},{lockedUntil:{$lte:now}}] };
        await Model.updateMany({notificationOutbox:{$elemMatch:{status:'publishing',attempts:{$gte:8},lockedUntil:{$lte:now}}}},{$set:{'notificationOutbox.$[e].status':'dead','notificationOutbox.$[e].lastErrorCode':'LEASE_ATTEMPTS_EXHAUSTED'}},{arrayFilters:[{'e.status':'publishing','e.attempts':{$gte:8},'e.lockedUntil':{$lte:now}}]});
        const doc=await Model.findOneAndUpdate({notificationOutbox:{$elemMatch:eligible}},{$set:{'notificationOutbox.$.status':'publishing','notificationOutbox.$.leaseId':leaseId,'notificationOutbox.$.lockedUntil':new Date(now.getTime()+30000)},$inc:{'notificationOutbox.$.attempts':1}},{new:true});
        if(!doc)break;
        const e=doc.notificationOutbox.find((e:any)=>e.leaseId===leaseId), match={_id:doc._id,notificationOutbox:{$elemMatch:{eventId:e.eventId,status:'publishing',leaseId}}};
        let returned=false;const onReturn=(m:any)=>{if(m.properties.messageId===e.eventId)returned=true;};channel.on('return',onReturn);
        try {
          const data={eventId:e.eventId,contractVersion:1,type:e.type,source:'payment-service',recipientUserId:e.recipientUserId,occurredAt:e.occurredAt.toISOString(),payload:{paymentId:e.paymentId,...(e.appointmentId?{appointmentId:e.appointmentId}:{}),version:e.version,simulated:true}};
          await new Promise<void>((resolve,reject)=>channel.publish('goleve.notifications','event',Buffer.from(JSON.stringify(data)),{persistent:true,mandatory:true,contentType:'application/json',messageId:e.eventId},error=>error?reject(error):resolve()));
          if(returned)throw new Error();
          await Model.updateOne(match,{$set:{'notificationOutbox.$.status':'published','notificationOutbox.$.publishedAt':new Date()},$unset:{'notificationOutbox.$.leaseId':1,'notificationOutbox.$.lockedUntil':1}});published++;
        }catch {
          await Model.updateOne(match,{$set:{'notificationOutbox.$.status':e.attempts>=8?'dead':'pending','notificationOutbox.$.lastErrorCode':'PUBLISH_UNCONFIRMED','notificationOutbox.$.nextAttemptAt':new Date(Date.now()+Math.min(300000,1000*2**e.attempts))},$unset:{'notificationOutbox.$.leaseId':1,'notificationOutbox.$.lockedUntil':1}});
        }finally{channel.removeListener('return',onReturn);}
      }
      return published;
    }finally{await channel.close().catch(()=>undefined);}
  }finally{await connection.close().catch(()=>undefined);}
}

// Explicit maintenance operation; not a public route and never an automatic retry of a dead event.
export async function recoverPaymentEvent(Model:any,paymentId:string,eventId:string) {
  assertNotificationDemo(Model.db.name);
  if(!/^[a-f0-9]{24}$/.test(paymentId)||!/^[a-f0-9-]{36}$/.test(eventId))throw new Error('Valid payment and event identifiers required');
  return Model.updateOne({_id:paymentId,notificationOutbox:{$elemMatch:{eventId,status:'dead'}}},{$set:{'notificationOutbox.$.status':'pending','notificationOutbox.$.attempts':0,'notificationOutbox.$.nextAttemptAt':new Date()},$unset:{'notificationOutbox.$.leaseId':1,'notificationOutbox.$.lockedUntil':1}});
}
