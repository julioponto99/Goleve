'use strict';
// Redeliver only an already-published fictional event. No payment call or queue purge.
const fs=require('node:fs'),cp=require('node:child_process');
const dotenv=require('../backend/node_modules/dotenv');
async function main(){
 if(process.env.LOCAL_DEMO_REDELIVERY_ACK!=='explicit-existing-fictional-event')throw Error('Explicit test acknowledgment required');
 const manifest=JSON.parse(fs.readFileSync('.secrets/local-runtime/demo-identities.json','utf8')),state=JSON.parse(fs.readFileSync('.local/demo-http-state.json','utf8')),env=dotenv.parse(fs.readFileSync('.env'));
 const id=state.payments.ptIntegrated,owner=manifest.accounts[0].id;
 if(state.instance!==manifest.instance||!/^[a-f0-9]{24}$/.test(id)||!/^[a-f0-9]{24}$/.test(owner))throw Error('Fixture state mismatch');
 function read(){const js=`const p=db.getSiblingDB('goleve_payment').appointment_payments.findOne({_id:ObjectId('${id}'),ownerId:'${owner}',state:'approved'});if(!p)throw Error('Approved fictional payment unavailable');const e=p.notificationOutbox.find(e=>e.type==='payment.simulated.approved.v1'&&e.status==='published');if(!e)throw Error('Published fictional event unavailable');print(JSON.stringify({event:{eventId:e.eventId,contractVersion:1,type:e.type,source:'payment-service',recipientUserId:e.recipientUserId,occurredAt:e.occurredAt.toISOString(),payload:{paymentId:e.paymentId,appointmentId:e.appointmentId,version:e.version,simulated:true}},notifications:db.getSiblingDB('goleve_notification').notifications.countDocuments({ownerId:'${owner}','reference.paymentId':'${id}'}),processed:db.getSiblingDB('goleve_notification').notification_processed_events.countDocuments({eventId:e.eventId})}));`;
  const r=cp.spawnSync('docker',['exec','-i','goleve-mongodb-1','mongosh','--quiet','--file','/dev/stdin'],{input:js,encoding:'utf8',timeout:15000});if(r.status!==0)throw Error('Read-only fixture verification failed');return JSON.parse(r.stdout.trim());}
 async function broker(url,body){const r=await fetch('http://127.0.0.1:'+(env.RABBITMQ_MANAGEMENT_PORT||15672)+url,{method:body?'POST':'GET',headers:{Authorization:'Basic '+Buffer.from(env.RABBITMQ_USER+':'+env.RABBITMQ_PASSWORD).toString('base64'),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Broker unavailable');return r.json();}
 const before=read();if(before.notifications!==1||before.processed!==1)throw Error('Expected exactly one existing fictional notification');
 const queueBefore=await broker('/api/queues/%2F/goleve.notification-service.events');
 const result=await broker('/api/exchanges/%2F/goleve.notifications/publish',{properties:{delivery_mode:2,content_type:'application/json',message_id:before.event.eventId},routing_key:'event',payload:JSON.stringify(before.event),payload_encoding:'string'});
 if(!result.routed)throw Error('Redelivery not routed');
 // Wait for the broker to record delivery+ACK, not merely an empty queue.
 const deliveries=q=>(q.message_stats?.deliver_get||0),acks=q=>(q.message_stats?.ack||0);let consumed=false;
 for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,500));const q=await broker('/api/queues/%2F/goleve.notification-service.events');if(deliveries(q)>deliveries(queueBefore)&&acks(q)>acks(queueBefore)&&q.messages_ready===0&&q.messages_unacknowledged===0){consumed=true;break;}}
 if(!consumed)throw Error('Redelivery consumption not confirmed');const after=read();if(after.notifications!==1||after.processed!==1)throw Error('Duplicate fictional notification detected');
 const report={recordedAt:new Date().toISOString(),passed:true,eventId:before.event.eventId,paymentId:id,notificationCount:1,processedEventCount:1,brokerDeliveryAndAckConfirmed:true,paymentApiCalls:0,infrastructureChanges:0};fs.writeFileSync('.local/redelivery-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
