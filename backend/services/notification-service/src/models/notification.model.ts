import { Schema } from 'mongoose';

export interface NotificationData {
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
