import { Schema, Types } from 'mongoose';
import { OwnedData, ownedFields, schemaOptions } from './common';
export interface AvailabilityData extends OwnedData {
  professionalId: Types.ObjectId; timeZone: string; preferredWeekdays: number[];
  windows: { weekday: number; startMinute: number; endMinute: number }[];
  serviceModes: string[]; visibility: string; operational: boolean;
}
const windowSchema = new Schema({
  weekday: { type: Number, required: true, min: 0, max: 6, validate: Number.isSafeInteger },
  startMinute: { type: Number, required: true, min: 0, max: 1439, validate: Number.isSafeInteger },
  endMinute: { type: Number, required: true, min: 0, max: 1439, validate: Number.isSafeInteger },
}, { _id: false, strict: 'throw' });
export const availabilitySchema = new Schema<AvailabilityData>({
  ...ownedFields, professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  timeZone: { type: String, required: true },
  preferredWeekdays: { type: [Number], required: true, validate: (v: number[]) => v.length >= 1 && v.length <= 7 },
  windows: { type: [windowSchema], required: true, validate: (v: unknown[]) => v.length >= 1 && v.length <= 14 },
  serviceModes: { type: [String], required: true, enum: ['online', 'in_person'], validate: (v: string[]) => v.length >= 1 && v.length <= 2 },
  visibility: { type: String, required: true, default: 'private', enum: ['private'], immutable: true },
  operational: { type: Boolean, required: true, default: false, validate: (value: boolean) => value === false, immutable: true },
}, { ...schemaOptions, collection: 'professional_availability_declarations' });
availabilitySchema.index({ authUserId: 1 }, { unique: true });
availabilitySchema.index({ professionalId: 1 }, { unique: true });
