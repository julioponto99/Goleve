const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const amqp=require('amqplib');
const {validateEvent}=require('../dist/contracts/events');
const {NotificationConsumer}=require('../dist/messaging/rabbitmq');
const tick=()=>new Promise(r=>setImmediate(r));

test('demo events are disabled by default while existing Training events remain available',()=>{
  const old=process.env.NOTIFICATION_DEMO_EVENTS_ENABLED;delete process.env.NOTIFICATION_DEMO_EVENTS_ENABLED;
  try{assert.throws(()=>validateEvent({type:'payment.simulated.approved.v1'}),{code:'DEMO_EVENTS_DISABLED'});assert.equal(validateEvent({eventId:'existing-training-123',contractVersion:1,type:'training.session.completed.v1',source:'training-service',recipientUserId:'507f1f77bcf86cd799439011',occurredAt:new Date().toISOString(),payload:{title:'Existing',body:'Existing'}}).source,'training-service');}
  finally{if(old!==undefined)process.env.NOTIFICATION_DEMO_EVENTS_ENABLED=old;}
});
for(const failure of [false,true])test('DLQ '+(failure?'publication failure leaves original unacknowledged':'ACK waits for broker confirmation'),async()=>{
  const connection=new EventEmitter(),channel=new EventEmitter(),confirm=new EventEmitter();let callback,acks=0;
  for(const name of ['assertExchange','assertQueue','bindQueue','prefetch','close'])channel[name]=async()=>{};
  channel.consume=async(q,fn)=>{channel.deliver=fn;};channel.ack=()=>{acks++;};channel.nack=()=>{throw Error('Unexpected retry after exhaustion');};
  connection.createChannel=async()=>channel;connection.createConfirmChannel=async()=>confirm;connection.close=async()=>{};confirm.close=async()=>{};confirm.publish=(a,b,c,d,cb)=>{callback=cb;};
  const original=amqp.connect;amqp.connect=async()=>connection;const consumer=new NotificationConsumer('amqp://fictitious.invalid',{processEvent:async()=>{throw Error('Synthetic persistence failure');}});
  try{await consumer.start();channel.deliver({content:Buffer.from('{}'),properties:{headers:{'x-death':[{queue:'goleve.notification-service.events',count:3}]}}});await tick();assert.equal(acks,0);assert.equal(typeof callback,'function');callback(failure?Error('Synthetic broker NACK'):null);await tick();assert.equal(acks,failure?0:1);if(failure)assert.equal(consumer.isHealthy(),false);}
  finally{await consumer.close();amqp.connect=original;}
});
test('failed notification persistence is retried without ACK',async()=>{
  const connection=new EventEmitter(),channel=new EventEmitter();let acks=0,nacks=0;
  for(const name of ['assertExchange','assertQueue','bindQueue','prefetch','close'])channel[name]=async()=>{};
  channel.consume=async(q,fn)=>{channel.deliver=fn;};channel.ack=()=>acks++;channel.nack=()=>nacks++;
  connection.createChannel=async()=>channel;connection.close=async()=>{};const original=amqp.connect;amqp.connect=async()=>connection;const consumer=new NotificationConsumer('amqp://fictitious.invalid',{});
  try{await consumer.start();channel.deliver({content:Buffer.from('{invalid'),properties:{headers:{}}});await tick();assert.equal(acks,0);assert.equal(nacks,1);}finally{await consumer.close();amqp.connect=original;}
});
test('consumer can reconnect after an initial broker failure without losing readiness semantics',async()=>{
  const connection=new EventEmitter(),channel=new EventEmitter();for(const name of ['assertExchange','assertQueue','bindQueue','prefetch','close'])channel[name]=async()=>{};channel.consume=async()=>{};connection.createChannel=async()=>channel;connection.close=async()=>{};
  const original=amqp.connect;let attempts=0;amqp.connect=async()=>{if(++attempts===1)throw Error('Synthetic unavailable broker');return connection;};const consumer=new NotificationConsumer('amqp://fictitious.invalid',{});
  try{await assert.rejects(consumer.start());assert.equal(consumer.isHealthy(),false);await consumer.close();await consumer.start();assert.equal(consumer.isHealthy(),true);}finally{await consumer.close();amqp.connect=original;}
});
