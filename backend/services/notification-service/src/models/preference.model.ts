import { Schema } from 'mongoose';

export interface NotificationPreferenceData {
  ownerId: string;
  enabled: boolean;
  hydrationReminders: boolean;
  trainingEvents: boolean;
  agendaReminders: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export const preferenceSchema = new Schema<NotificationPreferenceData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  enabled: { type: Boolean, default: true },
  hydrationReminders: { type: Boolean, default: true },
  trainingEvents: { type: Boolean, default: true },
  agendaReminders: { type: Boolean, default: true },
  version: { type: Number, default: 1, min: 1 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'notification_preferences' });
preferenceSchema.index({ ownerId: 1 }, { unique: true });
