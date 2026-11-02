import { Schema, Types } from 'mongoose';
import { CAPABILITY_KINDS } from '../config/catalog';
import { OwnedData, ownedFields, schemaOptions } from './common';

export const SERVICE_DURATIONS = [30, 45, 60, 90] as const;
export interface ProfessionalServiceData extends OwnedData {
  administrativelySuspended?:boolean;
  managementSuspended?: boolean;
  managementWasActive?: boolean;
  managementHistory?: {actorId:string;action:string;reasonCode:string;occurredAt:Date;version:number}[];
  professionalId: Types.ObjectId;
  capabilityId: Types.ObjectId;
  category: typeof CAPABILITY_KINDS[number];
  name: string;
  description: string;
  priceEur: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  active: boolean;
}

export const professionalServiceSchema = new Schema<ProfessionalServiceData>({
  administrativelySuspended:{type:Boolean,default:false},
  managementSuspended:{type:Boolean,default:false},
  managementWasActive:{type:Boolean,default:false},
  managementHistory:{type:[new Schema({actorId:String,action:String,reasonCode:String,occurredAt:Date,version:Number},{_id:false,strict:'throw'})],default:[],validate:(a:unknown[])=>a.length<=128},
  ...ownedFields,
  professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  capabilityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  category: { type: String, required: true, enum: CAPABILITY_KINDS, immutable: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 2, maxlength: 1000 },
  priceEur: { type: Number, required: true, min: 0, max: 1000 },
  durationMinutes: { type: Number, required: true, enum: SERVICE_DURATIONS },
  bufferBeforeMinutes: { type: Number, required: true, min: 0, max: 120, validate: Number.isSafeInteger },
  bufferAfterMinutes: { type: Number, required: true, min: 0, max: 120, validate: Number.isSafeInteger },
  active: { type: Boolean, required: true, default: true },
}, { ...schemaOptions, collection: 'professional_services' });
professionalServiceSchema.index({ professionalId: 1, active: 1, _id: -1 });
professionalServiceSchema.index({ authUserId: 1, active: 1, _id: -1 });
professionalServiceSchema.index({ capabilityId: 1, active: 1 });
professionalServiceSchema.index({ category: 1, active: 1, name: 1 });
