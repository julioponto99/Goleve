import { Schema } from 'mongoose';

export type ReminderFrequency = 'hourly' | 'two_hourly' | 'custom';
export interface ReminderData {
  ownerId: string;
  enabled: boolean;
  frequency: ReminderFrequency;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
  timezone: string;
  version: number;
  updatedAt: Date;
  createdAt: Date;
}

export const reminderSchema = new Schema<ReminderData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  enabled: { type: Boolean, required: true, default: false },
  frequency: { type: String, enum: ['hourly', 'two_hourly', 'custom'], required: true },
  intervalMinutes: { type: Number, required: true, min: 15, max: 1440 },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  timezone: { type: String, required: true, maxlength: 64 },
  version: { type: Number, required: true, default: 1, min: 1 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'hydration_reminders' });
reminderSchema.index({ ownerId: 1 }, { unique: true });
