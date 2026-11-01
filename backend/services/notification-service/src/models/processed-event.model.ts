import { Schema } from 'mongoose';

export interface ProcessedEventData { eventId: string; eventType: string; processedAt: Date }
export const processedEventSchema = new Schema<ProcessedEventData>({
  eventId: { type: String, required: true, immutable: true, maxlength: 128 },
  eventType: { type: String, required: true, immutable: true, maxlength: 100 },
  processedAt: { type: Date, required: true },
}, { versionKey: false, collection: 'notification_processed_events' });
processedEventSchema.index({ eventId: 1 }, { unique: true });
