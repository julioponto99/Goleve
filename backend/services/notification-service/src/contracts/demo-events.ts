import { createHash } from 'node:crypto';
import { ApiError } from '../config/errors';

export const demoTemplates = {
  'agenda.professional.requested.v1': ['agenda','Reserva solicitada','Recebeu um pedido de reserva profissional.'],
  'agenda.professional.accepted.v1': ['agenda','Reserva aceite','O profissional aceitou a sua reserva.'],
  'agenda.professional.declined.v1': ['agenda','Reserva recusada','O profissional recusou a sua reserva.'],
  'agenda.professional.cancelled.v1': ['agenda','Reserva cancelada','A reserva profissional foi cancelada.'],
  'agenda.professional.rescheduled.v1': ['agenda','Reserva reagendada','A reserva original foi substituída pelo novo horário aceite.'],
  'agenda.professional.reschedule-requested.v1': ['agenda','Reagendamento solicitado','Recebeu um pedido de novo horário; a reserva original mantém-se até à aceitação.'],
  'agenda.professional.expired.v1': ['agenda','Pedido expirado','O pedido de reserva expirou sem confirmação.'],
  'payment.simulated.approved.v1': ['payment','Pagamento simulado aprovado','O pagamento foi aprovado pelo banco simulado. Não é uma transação bancária real.'],
  'payment.simulated.declined.v1': ['payment','Pagamento simulado recusado','O banco simulado recusou esta tentativa de pagamento.'],
  'payment.simulated.cancelled.v1': ['payment','Pagamento simulado cancelado','A intenção de pagamento simulado foi cancelada.'],
  'payment.simulated.unknown.v1': ['payment','Resultado de pagamento incerto','O resultado do pagamento simulado não está confirmado. Aguarda reconciliação; não repita a cobrança.'],
  'payment.simulated.free.v1': ['payment','Serviço gratuito','O serviço foi registado sem cobrança bancária.'],
  'agenda.billing.refund-pending.v1': ['payment','Reembolso simulado pendente','O cancelamento originou uma sinalização de reembolso simulado pendente. Nenhum reembolso foi concluído.'],
} as const;
export function demoEvent(value: unknown) {
  const e=value as Record<string,any>;
  const invalid=():never=>{throw new ApiError(400,'INVALID_EVENT','Invalid isolated demonstration event');};
  if(!e||typeof e!=='object'||Array.isArray(e)||!Object.hasOwn(demoTemplates,e.type))return invalid();
  if(!['development','test'].includes(process.env.NODE_ENV||'')||process.env.NOTIFICATION_DEMO_EVENTS_ENABLED!=='true')throw new ApiError(403,'DEMO_EVENTS_DISABLED','Demonstration events are unavailable');
  if(Object.keys(e).some(k=>!['eventId','contractVersion','type','source','recipientUserId','occurredAt','payload'].includes(k))||e.contractVersion!==1||typeof e.eventId!=='string'||!/^[A-Za-z0-9._:-]{8,128}$/.test(e.eventId)||typeof e.recipientUserId!=='string'||!/^[a-f0-9]{24}$/.test(e.recipientUserId)||typeof e.occurredAt!=='string'||!Number.isFinite(Date.parse(e.occurredAt)))return invalid();
  if(e.source!==(e.type.startsWith('agenda.')?'agenda-service':'payment-service'))return invalid();
  const p=e.payload;if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['appointmentId','paymentId','relatedAppointmentId','operationId','version','simulated'].includes(k))||p.simulated!==true||!Number.isSafeInteger(p.version)||p.version<1)return invalid();
  for(const k of ['appointmentId','paymentId','relatedAppointmentId'])if(p[k]!==undefined&&(typeof p[k]!=='string'||!/^[a-f0-9]{24}$/.test(p[k])))return invalid();
  if(e.type.startsWith('agenda.')&&!p.appointmentId||e.type.startsWith('payment.')&&!p.paymentId)return invalid();
  if(e.type==='agenda.billing.refund-pending.v1'){
    if(!p.paymentId||typeof p.operationId!=='string'||!/^refund:[a-f0-9]{24}:[a-f0-9]{24}$/.test(p.operationId))return invalid();
  }else if(p.operationId!==undefined)return invalid();
  const [category,title,body]=demoTemplates[e.type as keyof typeof demoTemplates];
  // Semantic key permits cross-delivery correlation without suppressing a later version.
  const semantic=p.operationId?createHash('sha256').update([e.recipientUserId,e.type,p.operationId,p.version].join(':')).digest('hex'):undefined;
  return {...e,eventId:semantic?'operation:'+semantic:e.eventId,category,reference:{...(p.appointmentId?{appointmentId:p.appointmentId}:{}),...(p.paymentId?{paymentId:p.paymentId}:{}),...(p.relatedAppointmentId?{relatedAppointmentId:p.relatedAppointmentId}:{}),...(p.operationId?{operationId:p.operationId}:{}),version:p.version},payload:{title,body}};
}
