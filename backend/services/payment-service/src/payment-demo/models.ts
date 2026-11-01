import { Connection,Schema } from 'mongoose';
import { outboxFields } from '../events/outbox';
export interface AppointmentPayment { ownerId:string;appointmentId:string;rootId:string;serviceId:string;quote:any;state:string;idempotencyKey:string;confirmationKey?:string;claimToken?:string;processingStartedAt?:Date;transactionReference?:string;refundPending:boolean;reconciliationRequired:boolean;settledAppointmentId?:string;version:number;history:{state:string;reason:string;occurredAt:Date}[]; }
export function integratedPaymentModel(connection:Connection){
  const schema=new Schema<AppointmentPayment>({ownerId:{type:String,required:true},appointmentId:{type:String,required:true},rootId:{type:String,required:true},serviceId:{type:String,required:true},quote:{type:Schema.Types.Mixed,required:true,immutable:true},state:{type:String,required:true,enum:['pending','processing','approved','declined','free','unknown','cancelled','expired','failed']},idempotencyKey:{type:String,required:true},confirmationKey:String,claimToken:String,transactionReference:String,refundPending:{type:Boolean,default:false},reconciliationRequired:{type:Boolean,default:false},settledAppointmentId:String,version:{type:Number,default:1},history:[new Schema({state:String,reason:String,occurredAt:Date},{_id:false,strict:'throw'})]},{strict:'throw',versionKey:false,timestamps:true,collection:'appointment_payments'});
  schema.add({processingStartedAt:Date,...outboxFields});
  schema.index({'notificationOutbox.status':1,'notificationOutbox.nextAttemptAt':1});
  schema.index({ownerId:1,idempotencyKey:1},{unique:true});schema.index({rootId:1},{unique:true,partialFilterExpression:{state:{$in:['pending','processing','approved','free','unknown']}}});
  return connection.models.AppointmentPayment||connection.model('AppointmentPayment',schema);
}
