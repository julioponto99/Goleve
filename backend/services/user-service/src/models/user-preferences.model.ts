import { Schema } from 'mongoose';
import { OwnedData, ownedFields, schemaOptions } from './common';

export interface PreferencesData extends OwnedData {
  locale: string;
  timeZone: string;
  theme: string;
  units: { system: string };
  notifications: {
    channels: { inApp: boolean; email: boolean; push: boolean };
    categories: { appointments: boolean; activity: boolean; hydration: boolean; security: boolean };
  };
  quietHours?: { startMinute: number; endMinute: number; days: number[] };
}
const strict = { _id: false, strict: 'throw' as const };
export const preferencesSchema = new Schema<PreferencesData>({
  ...ownedFields,
  locale: { type: String, required: true, maxlength: 35 },
  timeZone: { type: String, required: true, maxlength: 100 },
  theme: { type: String, required: true, enum: ['system', 'light', 'dark'], default: 'system' },
  units: { type: new Schema({ system: { type: String, required: true, enum: ['metric', 'imperial'] } }, strict), required: true },
  notifications: { type: new Schema({
    channels: { type: new Schema({ inApp: Boolean, email: Boolean, push: Boolean }, strict), required: true },
    categories: { type: new Schema({ appointments: Boolean, activity: Boolean, hydration: Boolean, security: Boolean }, strict), required: true },
  }, strict), required: true },
  quietHours: { type: new Schema({
    startMinute: { type: Number, min: 0, max: 1439, validate: Number.isInteger },
    endMinute: { type: Number, min: 0, max: 1439, validate: Number.isInteger },
    days: { type: [Number], validate: (v: number[]) => v.length <= 7 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 6) },
  }, strict) },
}, { ...schemaOptions, collection: 'user_preferences' });
preferencesSchema.index({ authUserId: 1 }, { unique: true });
