'use strict';
const {isDeepStrictEqual}=require('node:util');
const name='goleve.agenda.professional.events',exchange='goleve.agenda.events';
function assert(value,message){if(!value)throw Error(message);}
function canonical(value){if(Array.isArray(value))return value.map(canonical).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
function retentionSnapshot(q,bindings,x){
 assert(q.name===name&&q.vhost==='/'&&q.state==='running','Retention queue identity/state mismatch');
 assert(q.durable===true&&q.auto_delete===false&&q.exclusive===false&&q.type==='classic','Retention queue must have persistent classic configuration');
 assert(q.messages===4&&q.messages_ready===4&&q.messages_unacknowledged===0&&q.consumers===0,'Unexpected retained backlog or active delivery');
 assert(q.messages_persistent===4&&Number.isSafeInteger(q.message_bytes_ready)&&q.message_bytes_ready>0&&q.message_bytes===q.message_bytes_ready&&q.message_bytes_persistent===q.message_bytes_ready,'All four retained messages must be persistent, including their bytes');
 // Fail closed on expiry/overflow policies, even if currently harmless.
 assert(!q.policy&&!q.operator_policy&&Object.keys(q.arguments||{}).length===0,'Retention policy or queue arguments need explicit review');
 assert(x.name===exchange&&x.vhost==='/'&&x.type==='topic'&&x.durable===true&&x.auto_delete===false&&x.internal===false&&Object.keys(x.arguments||{}).length===0,'Retention exchange persistence mismatch');
 const mapped=canonical(bindings.map(b=>({source:b.source,destination:b.destination,destination_type:b.destination_type,routing_key:b.routing_key,arguments:b.arguments||{},vhost:b.vhost})));
 const expected=canonical(['','agenda.professional.#','agenda.billing.#'].map(key=>({source:key?exchange:'',destination:name,destination_type:'queue',routing_key:key||name,arguments:{},vhost:'/'})));
 assert(isDeepStrictEqual(mapped,expected),'Retention bindings mismatch');
 return {queue:{name:q.name,vhost:q.vhost,type:q.type,durable:q.durable,auto_delete:q.auto_delete,exclusive:q.exclusive,arguments:q.arguments||{},policy:q.policy||null,operator_policy:q.operator_policy||null,messages:q.messages,messages_ready:q.messages_ready,messages_persistent:q.messages_persistent,messages_unacknowledged:q.messages_unacknowledged,consumers:q.consumers,message_bytes:q.message_bytes,message_bytes_ready:q.message_bytes_ready,message_bytes_persistent:q.message_bytes_persistent},exchange:{name:x.name,vhost:x.vhost,type:x.type,durable:x.durable,auto_delete:x.auto_delete,internal:x.internal,arguments:x.arguments||{}},bindings:mapped};
}
function sameRetention(before,after){assert(isDeepStrictEqual(canonical(before),canonical(after)),'Retained backlog, persistent bytes or topology changed');}
function otherQueuesIdle(queues){assert(queues.some(q=>q.name===name&&q.vhost==='/'),'Retention queue missing');assert(queues.filter(q=>q.name!==name||q.vhost!=='/').every(q=>q.messages_ready===0&&q.messages_unacknowledged===0),'Broker has active work outside the intentional retention queue');}
module.exports={retentionSnapshot,sameRetention,otherQueuesIdle};
