import { Schema } from 'mongoose';

export interface NotificationData {
  category?: string;
  reference?: { appointmentId?:string;paymentId?:string;relatedAppointmentId?:string;operationId?:string;version:number };
  ownerId: string;
  eventId: string;
  eventType: string;
  source: string;
  title: string;
  body: string;
  readAt?: Date;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const notificationSchema = new Schema<NotificationData>({
  category:{type:String,enum:['agenda','payment']},
  reference:{type:new Schema({appointmentId:String,paymentId:String,relatedAppointmentId:String,operationId:String,version:Number},{_id:false,strict:'throw'}),default:undefined},
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  eventId: { type: String, required: true, immutable: true, maxlength: 128 },
  eventType: { type: String, required: true, immutable: true, maxlength: 100 },
  source: { type: String, required: true, immutable: true, maxlength: 100 },
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 2000 },
  readAt: Date,
  occurredAt: { type: Date, required: true, immutable: true },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'notifications' });
notificationSchema.index({ ownerId: 1, createdAt: -1, _id: 1 });
notificationSchema.index({ ownerId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ eventId: 1 }, { unique: true });
