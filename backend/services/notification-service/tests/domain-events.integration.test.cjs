const {describe,test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes,randomUUID}=require('node:crypto');
const {createRequire}=require('node:module');
const path=require('node:path');
const mongoose=require('mongoose');
const amqp=require('amqplib');
const agenda=createRequire(path.resolve(__dirname,'../../agenda-service/package.json'));
const payment=createRequire(path.resolve(__dirname,'../../payment-service/package.json'));
const {NotificationService}=require('../dist/services/notification.service');
const {NotificationConsumer,notificationExchange,failedQueue}=require('../dist/messaging/rabbitmq');
const {validateEvent}=require('../dist/contracts/events');
const {demoTemplates}=require('../dist/contracts/demo-events');
const {notificationTransition,publishPaymentOutbox,recoverPaymentEvent}=payment('./dist/events/outbox');
const {publishProfessionalOutbox}=agenda('./dist/professional/outbox');
const oid=()=>new mongoose.Types.ObjectId().toHexString(),ctx=(id,role='utilizador')=>({identity:{id,userType:role},requestId:randomUUID()});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(check){const end=Date.now()+7000;while(Date.now()<end){if(await check())return;await delay(40);}throw Error('Timed out waiting for isolated delivery');}

describe('Agenda + Payment + Notification: isolated domain events',()=>{
  const root=new URL(process.env.NOTIFICATION59_MONGO_URI||'http://missing.invalid'),instance=randomBytes(8).toString('hex');
  assert.equal(root.protocol,'mongodb:');assert(['localhost','127.0.0.1'].includes(root.hostname));assert.equal(root.searchParams.get('replicaSet'),'notify59');
  const rabbit=process.env.NOTIFICATION59_RABBITMQ_URL;assert.equal(new URL(rabbit).hostname,'127.0.0.1');
  const uri=(service)=>{const u=new URL(root);u.pathname=service==='notification'?'/goleve_notification59_'+instance+'_notification':'/goleve_payagenda_'+instance+'_'+service;return u.toString();};
  let nc,ac,pc,nm,am,personal,Payment,notifier,consumer,broker,channel,billing;
  const states=new Map(),config={service:'agenda',instance,origins:{},keys:{payment:randomBytes(32),professional:randomBytes(32)}};
  const eligibility={async check(input){const w=states.get(input.capabilityId);return{professionalId:w.professionalId,professionalAuthUserId:w.pro,capabilityId:w.cap,relationshipKind:'personal_training',eligible:true,canOfferAppointment:true,authority:'synthetic',serviceModes:['online'],relationshipAccepted:false,checkedAtUtc:new Date().toISOString(),validUntilUtc:new Date(Date.now()+10000).toISOString()};}};
  async function world(){
    const w={user:oid(),pro:oid(),professionalId:oid(),cap:oid()},day=new Date(Date.now()+5*86400000);day.setUTCHours(10,0,0,0);w.start=day.getTime();states.set(w.cap,w);
    w.service=new (agenda('./dist/professional/service').ProfessionalAgendaService)(ac,am,personal,eligibility,undefined,billing);
    await w.service.createRule(ctx(w.pro,'profissional'),{capabilityId:w.cap,weekday:day.getUTCDay(),localStartTime:'08:00',localEndTime:'20:00',timezone:'UTC',sessionModes:['online'],environments:[],slotDurationMinutes:60,bufferBeforeMinutes:0,bufferAfterMinutes:0,validFrom:day.toISOString().slice(0,10),validUntil:day.toISOString().slice(0,10)},randomUUID());return w;
  }
  const input=(w,offset=0)=>({professionalId:w.professionalId,capabilityId:w.cap,appointmentType:'initial_session',mode:'online',startAtUtc:new Date(w.start+offset).toISOString(),endAtUtc:new Date(w.start+offset+3600000).toISOString(),timezone:'UTC'});
  const reserve=w=>w.service.request(ctx(w.user),input(w),randomUUID());
  const transition=(w,a,action,actor=w.pro)=>w.service.transition(ctx(actor,actor===w.pro?'profissional':'utilizador'),a.id,action,a.version,randomUUID(),action==='decline'||action==='cancel'&&actor===w.pro?{reasonCode:'scheduling_change'}:{});
  const makePayment=(owner=oid())=>Payment.create({ownerId:owner,appointmentId:oid(),rootId:oid(),serviceId:oid(),quote:{},state:'pending',idempotencyKey:randomUUID(),history:[]});
  const change=(p,state)=>notificationTransition(Payment,{_id:p._id,state:p.state},{$set:{state},$inc:{version:1},$push:{history:{state,reason:'synthetic-test',occurredAt:new Date()}}},state);
  const wire=(type,owner=oid(),extra={})=>({eventId:randomUUID(),contractVersion:1,type,source:type.startsWith('agenda.')?'agenda-service':'payment-service',recipientUserId:owner,occurredAt:new Date().toISOString(),payload:{...(type.startsWith('agenda.')?{appointmentId:oid()}:{paymentId:oid()}),version:1,simulated:true,...extra}});
  before(async()=>{
    Object.assign(process.env,{NODE_ENV:'test',NOTIFICATION_DEMO_EVENTS_ENABLED:'true'});
    nc=await mongoose.createConnection(uri('notification')).asPromise();ac=await agenda('mongoose').createConnection(uri('agenda')).asPromise();pc=await payment('mongoose').createConnection(uri('payment')).asPromise();
    const n=require('../dist/models');nm=n.createNotificationModels(nc);await n.initializeModels(nm);notifier=new NotificationService(nm);
    const a=agenda('./dist/professional/models');am=a.createProfessionalAgendaModels(ac);await a.initializeProfessionalAgendaModels(am);const p=agenda('./dist/models');personal=p.createAgendaModels(ac);await p.initializeModels(personal);
    billing=new (agenda('./dist/payment-demo/billing').AgendaBilling)(ac,am,config);await billing.initialize();
    Payment=payment('./dist/payment-demo/models').integratedPaymentModel(pc);await Payment.init();
    consumer=new NotificationConsumer(rabbit,notifier,50);await consumer.start();broker=await amqp.connect(rabbit);channel=await broker.createConfirmChannel();
  });
  after(async()=>{await consumer?.close();await channel?.close();await broker?.close();await Promise.all([nc?.close(),ac?.close(),pc?.close()]);});

  test('requested and accepted states publish only to the persisted professional and client',async()=>{
    const w=await world(),a=await reserve(w);await transition(w,a.data,'accept');await publishProfessionalOutbox(am,rabbit);
    await wait(async()=>await nm.Notification.countDocuments({ownerId:w.user})===1&&await nm.Notification.countDocuments({ownerId:w.pro})===1);
    assert.equal((await nm.Notification.findOne({ownerId:w.pro})).eventType,'agenda.professional.requested.v1');assert.equal((await nm.Notification.findOne({ownerId:w.user})).eventType,'agenda.professional.accepted.v1');
  });
  test('rollback cannot persist or publish a requested notification',async()=>{
    const w=await world(),before=await am.Outbox.countDocuments(),original=am.History.create;am.History.create=async()=>{throw Error('Synthetic audit failure');};
    try{await assert.rejects(reserve(w));}finally{am.History.create=original;}
    assert.equal(await am.Outbox.countDocuments(),before);assert.equal(await am.Appointment.countDocuments({subjectAuthUserId:w.user}),0);
  });
  test('Agenda publication NACK retains the event and explicit recovery retains its identity',async()=>{
    await publishProfessionalOutbox(am,rabbit,50);const w=await world(),a=await reserve(w),original=amqp.connect;
    amqp.connect=async()=>({createConfirmChannel:async()=>({assertExchange:async()=>{},assertQueue:async()=>{},bindQueue:async()=>{},on(){},removeListener(){},publish(a,b,c,d,cb){cb(Error('Synthetic Agenda NACK'));},close:async()=>{}}),close:async()=>{}});
    try{assert.equal(await publishProfessionalOutbox(am,rabbit,1),0);}finally{amqp.connect=original;}
    const event=await am.Outbox.findOne({appointmentId:a.data.id});assert.equal(event.status,'pending');assert.equal(event.attempts,1);assert(event.nextAttemptAt>Date.now());
    await am.Outbox.updateOne({_id:event._id},{$set:{status:'publishing',attempts:8,lockedUntil:new Date(0)}});await publishProfessionalOutbox(am,rabbit,1);assert.equal((await am.Outbox.findById(event._id)).status,'dead');
    await agenda('./dist/professional/outbox').recoverProfessionalEvent(am,event.eventId);assert.equal(await publishProfessionalOutbox(am,rabbit,1),1);assert.equal((await am.Outbox.findById(event._id)).eventId,event.eventId);
  });
  test('concurrent Agenda publishers claim one event once while recipients deduplicate re-delivery',async()=>{
    await publishProfessionalOutbox(am,rabbit,50);const w=await world(),a=await reserve(w);const counts=await Promise.all(Array.from({length:3},()=>publishProfessionalOutbox(am,rabbit,1)));assert.equal(counts.reduce((a,b)=>a+b,0),1);await wait(async()=>await nm.Notification.countDocuments({ownerId:w.pro})===1);
    const e=await am.Outbox.findOne({appointmentId:a.data.id});await am.Outbox.updateOne({_id:e._id},{$set:{status:'pending',nextAttemptAt:new Date(0)}});await publishProfessionalOutbox(am,rabbit,1);await delay(100);assert.equal(await nm.Notification.countDocuments({ownerId:w.pro}),1);
  });
  test('decline and participant cancellations select the other recipient',async()=>{
    for(const action of ['decline','cancel']){const w=await world(),a=await reserve(w);await transition(w,a.data,action);const e=await am.Outbox.findOne({appointmentId:a.data.id,type:'agenda.professional.'+(action==='decline'?'declined':'cancelled')+'.v1'});assert.deepEqual(e.notifications.map(n=>n.recipientUserId),[w.user]);}
    const w=await world(),a=await reserve(w);await transition(w,a.data,'cancel',w.user);const e=await am.Outbox.findOne({appointmentId:a.data.id,type:'agenda.professional.cancelled.v1'});assert.deepEqual(e.notifications.map(n=>n.recipientUserId),[w.pro]);
  });
  test('rescheduling notifies the professional of the request and both participants of replacement',async()=>{
    const w=await world(),first=await reserve(w),accepted=await transition(w,first.data,'accept');const next=await w.service.request(ctx(w.user),input(w,3*3600000),randomUUID(),accepted.data.id,accepted.data.version);await transition(w,next.data,'accept');
    const request=await am.Outbox.findOne({appointmentId:next.data.id,type:'agenda.professional.requested.v1'}),replaced=await am.Outbox.findOne({appointmentId:first.data.id,type:'agenda.professional.rescheduled.v1'});
    assert.equal(request.notifications[0].type,'agenda.professional.reschedule-requested.v1');assert.equal(replaced.notifications.length,2);assert.equal(replaced.notifications[0].payload.relatedAppointmentId,next.data.id);
  });
  test('persisted expiry emits an event for the client',async()=>{
    const w=await world(),a=await reserve(w);await am.Appointment.collection.updateOne({_id:new (agenda('mongoose').Types.ObjectId)(a.data.id)},{$set:{expiresAtUtc:new Date(Date.now()-1)}});await w.service.expireDue();const e=await am.Outbox.findOne({appointmentId:a.data.id,type:'agenda.professional.expired.v1'});assert.equal(e.notifications[0].recipientUserId,w.user);
  });
  test('paid cancellation persists a correlated pending simulated refund in the same transaction',async()=>{
    const w=await world(),a=await reserve(w),accepted=await transition(w,a.data,'accept'),attemptId=oid();await billing.Ledger.create({_id:a.data.id,ownerId:w.user,professionalAuthUserId:w.pro,currentAppointmentId:a.data.id,state:'approved',attemptId,bankApproved:true});
    await transition(w,accepted.data,'cancel',w.user);const e=await am.Outbox.findOne({appointmentId:a.data.id,type:'agenda.billing.refund-pending.v1'});assert(e);assert.equal(e.notifications[0].payload.operationId,'refund:'+a.data.id+':'+attemptId);assert.equal((await billing.Ledger.findById(a.data.id)).refundPending,true);
    await publishProfessionalOutbox(am,rabbit,50);await wait(async()=>!!await nm.Notification.findOne({ownerId:w.user,eventType:'agenda.billing.refund-pending.v1'}));const n=await nm.Notification.findOne({ownerId:w.user,eventType:'agenda.billing.refund-pending.v1'});assert.match(n.body,/pendente/);assert.match(n.body,/Nenhum reembolso foi concluído/);
  });
  test('refund outbox failure rolls back reservation and ledger together',async()=>{
    const w=await world(),a=await reserve(w),accepted=await transition(w,a.data,'accept');await billing.Ledger.create({_id:a.data.id,ownerId:w.user,professionalAuthUserId:w.pro,currentAppointmentId:a.data.id,state:'approved',attemptId:oid(),bankApproved:true});
    const original=am.Outbox.create;am.Outbox.create=async function(rows,...args){if(rows.some(e=>e.type==='agenda.billing.refund-pending.v1'))throw Error('Synthetic refund outbox failure');return original.call(this,rows,...args);};
    try{await assert.rejects(transition(w,accepted.data,'cancel',w.user));}finally{am.Outbox.create=original;}
    assert.equal((await am.Appointment.findById(a.data.id)).status,'accepted');assert.equal((await billing.Ledger.findById(a.data.id)).refundPending,false);
  });
  for(const state of ['approved','declined','cancelled','unknown','free'])test('payment '+state+' is atomic with its event and rendered as a simulation',async()=>{
    const p=await makePayment();await change(p,state);const stored=await Payment.findById(p._id);assert.equal(stored.state,state);assert.equal(stored.notificationOutbox.length,1);await publishPaymentOutbox(Payment,rabbit);
    await wait(async()=>!!await nm.Notification.findOne({ownerId:p.ownerId}));const n=await nm.Notification.findOne({ownerId:p.ownerId});assert.equal(n.category,'payment');assert.equal(n.reference.paymentId,String(p._id));if(state==='unknown')assert.match(n.body,/não está confirmado/);assert.equal(JSON.stringify(stored.notificationOutbox).includes('priceCents'),false);
  });
  test('concurrent state transitions and concurrent publishers produce one logical notification',async()=>{
    const p=await makePayment(),out=await Promise.all(Array.from({length:5},()=>change(p,'approved')));assert.equal(out.filter(Boolean).length,1);const pubs=await Promise.all(Array.from({length:3},()=>publishPaymentOutbox(Payment,rabbit)));assert.equal(pubs.reduce((a,b)=>a+b,0),1);await wait(async()=>await nm.Notification.countDocuments({ownerId:p.ownerId})===1);
    const e=(await Payment.findById(p._id)).notificationOutbox[0],raw={eventId:e.eventId,contractVersion:1,type:e.type,source:'payment-service',recipientUserId:e.recipientUserId,occurredAt:e.occurredAt.toISOString(),payload:{paymentId:e.paymentId,appointmentId:e.appointmentId,version:e.version,simulated:true}};
    for(let i=0;i<3;i++)channel.publish(notificationExchange,'event',Buffer.from(JSON.stringify(raw)),{persistent:true});await delay(150);assert.equal(await nm.Notification.countDocuments({ownerId:p.ownerId}),1);
  });
  test('real integrated payment confirmation emits approval or refusal only with its persisted outcome',async()=>{
    for(const outcome of ['approve','decline']){
      const owner=oid(),p=await makePayment(owner),quote={quoteId:oid(),serviceId:p.serviceId,professionalId:oid(),capabilityId:oid(),priceCents:2500,currency:'EUR',serviceVersion:1,durationMinutes:60,expiresAt:new Date(Date.now()+900000).toISOString(),authority:'synthetic'};
      await Payment.collection.updateOne({_id:p._id},{$set:{quote}});
      const service=new (payment('./dist/payment-demo/service').IntegratedPaymentService)(pc,{...config,service:'payment'},{authorize:async()=>({outcome,transactionReference:'mock_synthetic_receipt'})});
      service.client.call=async(target,op)=>op==='context'?{appointmentId:p.appointmentId,ownerId:owner,rootId:p.rootId,serviceId:p.serviceId,professionalId:quote.professionalId,capabilityId:quote.capabilityId,status:'accepted',version:1,durationMinutes:60,billing:null}:op==='claim'?{claimToken:randomUUID(),rootId:p.rootId,quote}:{state:outcome==='approve'?'approved':'declined'};
      const result=await service.confirm(ctx(owner),String(p._id),randomUUID());assert.equal(result.state,outcome==='approve'?'approved':'declined');const stored=await Payment.findById(p._id);assert.equal(stored.notificationOutbox[0].type,'payment.simulated.'+result.state+'.v1');
    }
  });
  test('real integrated payment timeout path emits unknown and never implies approval',async()=>{
    const owner=oid(),p=await makePayment(owner),quote={quoteId:oid(),serviceId:p.serviceId,professionalId:oid(),capabilityId:oid(),priceCents:2500,currency:'EUR',serviceVersion:1,durationMinutes:60,expiresAt:new Date(Date.now()+900000).toISOString(),authority:'synthetic'};await Payment.collection.updateOne({_id:p._id},{$set:{quote}});
    const service=new (payment('./dist/payment-demo/service').IntegratedPaymentService)(pc,{...config,service:'payment'},{authorize:async()=>{throw Error('Synthetic uncertain bank transport');}});
    service.client.call=async(target,op)=>op==='context'?{appointmentId:p.appointmentId,ownerId:owner,rootId:p.rootId,serviceId:p.serviceId,professionalId:quote.professionalId,capabilityId:quote.capabilityId,status:'accepted',version:1,durationMinutes:60,billing:null}:op==='claim'?{claimToken:randomUUID(),rootId:p.rootId,quote}:{state:'unknown'};
    assert.equal((await service.confirm(ctx(owner),String(p._id),randomUUID())).state,'unknown');const e=(await Payment.findById(p._id)).notificationOutbox[0];assert.equal(e.type,'payment.simulated.unknown.v1');
  });
  test('payment update failure cannot leave an event without its corresponding state',async()=>{
    const p=await makePayment(),original=Payment.updateOne;Payment.updateOne=async function(filter,update,...args){if(update.$push?.notificationOutbox)throw Error('Synthetic atomic update failure');return original.call(this,filter,update,...args);};
    try{await assert.rejects(change(p,'approved'));}finally{Payment.updateOne=original;}
    const stored=await Payment.findById(p._id);assert.equal(stored.state,'pending');assert.equal(stored.notificationOutbox.length,0);
  });
  test('confirmed delivery survives an expired worker lease after restart',async()=>{
    await publishPaymentOutbox(Payment,rabbit,50);
    const p=await makePayment(),d=await change(p,'approved');await Payment.updateOne({_id:p._id},{$set:{'notificationOutbox.0.status':'publishing','notificationOutbox.0.leaseId':'interrupted-worker','notificationOutbox.0.lockedUntil':new Date(Date.now()-1),'notificationOutbox.0.attempts':1}});assert.equal(await publishPaymentOutbox(Payment,rabbit,1),1);assert.equal((await Payment.findById(p._id)).notificationOutbox[0].eventId,d.notificationOutbox[0].eventId);
  });
  test('RabbitMQ connection failure retains pending state without losing the outbox',async()=>{
    const p=await makePayment();await change(p,'declined');await assert.rejects(publishPaymentOutbox(Payment,'amqp://127.0.0.1:1',1));assert.equal((await Payment.findById(p._id)).notificationOutbox[0].status,'pending');await publishPaymentOutbox(Payment,rabbit);
  });
  test('mandatory-return rejects an unrouted payment event even when the broker confirms',async()=>{
    const p=await makePayment();await change(p,'approved');const original=amqp.connect;let returned;
    amqp.connect=async()=>({createConfirmChannel:async()=>({assertExchange:async()=>{},assertQueue:async()=>{},bindQueue:async()=>{},on(name,fn){if(name==='return')returned=fn;},removeListener(){},publish(a,b,c,options,cb){returned({properties:{messageId:options.messageId}});cb(null);},close:async()=>{}}),close:async()=>{}});
    try{assert.equal(await publishPaymentOutbox(Payment,rabbit,1),0);}finally{amqp.connect=original;}
    assert.equal((await Payment.findById(p._id)).notificationOutbox[0].status,'pending');await Payment.updateOne({_id:p._id},{$set:{'notificationOutbox.0.nextAttemptAt':new Date(0)}});await publishPaymentOutbox(Payment,rabbit);
  });
  test('publisher NACK backs off, retains dead events after eight attempts and supports explicit recovery',async()=>{
    const p=await makePayment();await change(p,'approved');const original=amqp.connect;amqp.connect=async()=>({createConfirmChannel:async()=>({assertExchange:async()=>{},assertQueue:async()=>{},bindQueue:async()=>{},on(){},removeListener(){},publish(a,b,c,d,cb){cb(Error('Synthetic broker NACK'));},close:async()=>{}}),close:async()=>{}});
    try{for(let i=0;i<8;i++){await Payment.updateOne({_id:p._id},{$set:{'notificationOutbox.0.nextAttemptAt':new Date(0)}});assert.equal(await publishPaymentOutbox(Payment,rabbit,1),0);const d=await Payment.findById(p._id);assert.equal(d.notificationOutbox[0].attempts,i+1);assert(d.notificationOutbox[0].nextAttemptAt>Date.now());}}finally{amqp.connect=original;}
    const d=await Payment.findById(p._id);assert.equal(d.notificationOutbox[0].status,'dead');assert.equal((await recoverPaymentEvent(Payment,String(p._id),d.notificationOutbox[0].eventId)).modifiedCount,1);assert.equal(await publishPaymentOutbox(Payment,rabbit,1),1);
  });
  test('outbox cap blocks another transition; only old confirmed events are cleaned',async()=>{
    const p=await makePayment(),d=await change(p,'declined'),e=d.notificationOutbox[0].toObject();await Payment.collection.updateOne({_id:p._id},{$set:{state:'pending',notificationOutbox:Array.from({length:16},(_,i)=>({...e,eventId:randomUUID(),status:'dead'}))}});
    await assert.rejects(change(p,'cancelled'),{code:'NOTIFICATION_OUTBOX_FULL'});assert.equal((await Payment.findById(p._id)).state,'pending');
    await Payment.collection.updateOne({_id:p._id},{$set:{notificationOutbox:Array.from({length:16},()=>({...e,eventId:randomUUID(),status:'published',publishedAt:new Date(Date.now()-86400001)}))}});assert.equal((await change(p,'cancelled')).notificationOutbox.length,1);
  });
  test('payment state/outbox update needs no MongoDB session or distributed transaction',async()=>{
    const p=await makePayment(),original=pc.startSession;pc.startSession=()=>{throw Error('Sessions forbidden for standalone-compatible payment transition');};try{assert.equal((await change(p,'approved')).state,'approved');}finally{pc.startSession=original;}
  });
  test('preferences suppress replay permanently and distinguish payment from agenda categories',async()=>{
    const owner=oid();await nm.Preference.collection.insertOne({ownerId:owner,enabled:true,agendaReminders:false,version:1});await notifier.processEvent(wire('payment.simulated.approved.v1',owner));const e=wire('agenda.professional.accepted.v1',owner);assert.equal((await notifier.processEvent(e)).suppressed,true);
    await notifier.setPreferences(ctx(owner),{agendaReminders:true,paymentEvents:false});await notifier.processEvent(e);assert.equal(await nm.Notification.countDocuments({ownerId:owner}),1);assert.equal((await notifier.processEvent(wire('payment.simulated.declined.v1',owner))).suppressed,true);
    await notifier.setPreferences(ctx(owner),{enabled:false});assert.equal((await notifier.processEvent(wire('agenda.professional.expired.v1',owner))).suppressed,true);
  });
  test('refund correlation deduplicates repeated operation versions but preserves later updates',async()=>{
    const owner=oid(),e=wire('agenda.billing.refund-pending.v1',owner,{paymentId:oid(),operationId:'refund:'+oid()+':'+oid()});await notifier.processEvent(e);await notifier.processEvent({...e,eventId:randomUUID()});await notifier.processEvent({...e,eventId:randomUUID(),payload:{...e.payload,version:2}});assert.equal(await nm.Notification.countDocuments({ownerId:owner}),2);
  });
  test('users cannot list or mark another user notification as read',async()=>{
    const owner=oid(),other=oid(),r=await notifier.processEvent(wire('payment.simulated.approved.v1',owner));assert.equal((await notifier.list(ctx(other),{page:1,pageSize:20})).total,0);await assert.rejects(notifier.markRead(ctx(other),r.notification.id),{code:'NOT_FOUND'});
  });
  test('new contracts reject extra sensitive fields, invalid source, version and public recipients',()=>{
    const e=wire('payment.simulated.approved.v1');for(const bad of [{...e,source:'agenda-service'},{...e,contractVersion:2},{...e,recipientUserId:'arbitrary'},{...e,token:'do-not-persist'},{...e,payload:{...e.payload,priceCents:100}},{...e,payload:{...e.payload,simulated:false}}])assert.throws(()=>validateEvent(bad));
    for(const type of Object.keys(demoTemplates)){const extra=type==='agenda.billing.refund-pending.v1'?{paymentId:oid(),operationId:'refund:'+oid()+':'+oid()}:{};assert.equal(validateEvent(wire(type,oid(),extra)).type,type);}
  });
  test('Training and Hydration contracts and templates remain compatible',async()=>{
    for(const type of ['training.session.completed.v1','hydration.reminder.requested.v1','hydration.daily_goal.reached.v1']){const owner=oid();await notifier.processEvent({eventId:randomUUID(),contractVersion:1,type,source:type.startsWith('training')?'training-service':'hydration-service',recipientUserId:owner,occurredAt:new Date().toISOString(),payload:{title:'Existing template',body:'Existing event'}});assert.equal((await nm.Notification.findOne({ownerId:owner})).title,'Existing template');}
  });
  test('invalid messages retry three times and are confirmed into the DLQ',async()=>{
    const before=(await channel.checkQueue(failedQueue)).messageCount;await new Promise((resolve,reject)=>channel.publish(notificationExchange,'event',Buffer.from('{invalid'),{persistent:true,messageId:randomUUID()},e=>e?reject(e):resolve()));await wait(async()=>(await channel.checkQueue(failedQueue)).messageCount>before);assert.equal(consumer.isHealthy(),true);
  });
  test('demonstration consumption and publishing are blocked in production',async()=>{
    const old=process.env.NODE_ENV;process.env.NODE_ENV='production';try{assert.throws(()=>validateEvent(wire('payment.simulated.approved.v1')));await assert.rejects(publishPaymentOutbox(Payment,rabbit));assert.throws(()=>require('../dist/config/demo').assertDemoNotifications(nc.name));}finally{process.env.NODE_ENV=old;}
  });
});
