import { AppointmentData } from './models';

export function appointmentNotifications(doc: AppointmentData & { _id: unknown }, action: string, eventId: string, occurredAt: Date, actorId?: string) {
  let type='agenda.professional.'+action+'.v1', recipients:string[]=[];
  if(action==='requested') { if(doc.rescheduleOfId)type='agenda.professional.reschedule-requested.v1';recipients=[doc.professionalAuthUserId]; }
  else if(['accepted','declined','expired'].includes(action))recipients=[doc.subjectAuthUserId];
  else if(action==='cancelled')recipients=[doc.subjectAuthUserId,doc.professionalAuthUserId].filter(id=>id!==actorId);
  else if(action==='rescheduled')recipients=[doc.subjectAuthUserId,doc.professionalAuthUserId];
  return [...new Set(recipients)].map(recipientUserId=>({eventId:eventId+':'+recipientUserId,contractVersion:1,type,source:'agenda-service',recipientUserId,occurredAt:occurredAt.toISOString(),payload:{appointmentId:String(doc._id),version:doc.version,simulated:true,...(doc.rescheduleOfId?{relatedAppointmentId:doc.rescheduleOfId}:{}),...(doc.rescheduledToId?{relatedAppointmentId:doc.rescheduledToId}:{})}}));
}
