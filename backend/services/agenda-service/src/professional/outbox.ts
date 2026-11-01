import { randomUUID } from 'node:crypto';
import amqp from 'amqplib';
import { ProfessionalAgendaModels } from './models';
export const AGENDA_EXCHANGE='goleve.agenda.events';
export const AGENDA_QUEUE='goleve.agenda.professional.events';
export async function publishProfessionalOutbox(models:ProfessionalAgendaModels,url:string,limit=20) {
  const connection=await amqp.connect(url,{timeout:3000});
  try {
    const channel=await connection.createConfirmChannel();
    try {
      await channel.assertExchange(AGENDA_EXCHANGE,'topic',{durable:true});
      await channel.assertQueue(AGENDA_QUEUE,{durable:true});
      await channel.bindQueue(AGENDA_QUEUE,AGENDA_EXCHANGE,'agenda.professional.#');
      await models.Outbox.updateMany({status:'publishing',lockedUntil:{$lte:new Date()},attempts:{$gte:8}},{$set:{status:'dead',lastErrorCode:'LEASE_ATTEMPTS_EXHAUSTED'},$unset:{leaseId:1,lockedUntil:1}});
      let published=0;
      for(let i=0;i<limit;i++) {
        const now=new Date(),leaseId=randomUUID();
        const event=await models.Outbox.findOneAndUpdate({status:{$in:['pending','publishing']},nextAttemptAt:{$lte:now},attempts:{$lt:8},$or:[{lockedUntil:{$exists:false}},{lockedUntil:{$lte:now}}]},
          {$set:{status:'publishing',leaseId,lockedUntil:new Date(now.getTime()+30000)},$inc:{attempts:1}},{sort:{_id:1},new:true});
        if(!event)break;
        let returned=false;
        const onReturn=(message:{properties:{messageId?:string}})=>{if(message.properties.messageId===event.eventId)returned=true;};
        channel.on('return',onReturn);
        try {
          const data={eventId:event.eventId,contractVersion:1,type:event.type,source:'agenda-service',aggregateId:event.appointmentId,aggregateVersion:event.aggregateVersion,
            occurredAt:event.occurredAt.toISOString(),payload:{appointmentId:event.appointmentId,version:event.aggregateVersion}};
          await new Promise<void>((resolve,reject)=>channel.publish(AGENDA_EXCHANGE,event.type,Buffer.from(JSON.stringify(data)),{persistent:true,mandatory:true,contentType:'application/json',messageId:event.eventId},error=>error?reject(error):resolve()));
          if(returned)throw new Error('Agenda event was not routed');
          await models.Outbox.updateOne({_id:event._id,status:'publishing',leaseId},{$set:{status:'published',publishedAt:new Date()},$unset:{leaseId:1,lockedUntil:1,lastErrorCode:1}});published++;
        }catch{
          await models.Outbox.updateOne({_id:event._id,status:'publishing',leaseId},{$set:{status:event.attempts>=8?'dead':'pending',lastErrorCode:'PUBLISH_UNCONFIRMED',nextAttemptAt:new Date(Date.now()+Math.min(300000,1000*2**event.attempts))},$unset:{leaseId:1,lockedUntil:1}});
        }finally{channel.removeListener('return',onReturn);}
      }
      return published;
    }finally{await channel.close().catch(()=>undefined);}
  }finally{await connection.close().catch(()=>undefined);}
}
