import { Schema } from 'mongoose';
export interface OutboxEventData {
  eventId: string; eventType: string; eventVersion: 1; sourceService: string; aggregateId: string; recipientUserId?: string;
  occurredAt: Date; payload: Record<string, unknown>; status: 'pending' | 'publishing' | 'published' | 'failed'; attempts: number;
  leaseId?: string; lockedUntil?: Date; nextAttemptAt: Date; lastError?: string; publishedAt?: Date; createdAt: Date; updatedAt: Date;
}
export const outboxSchema = new Schema<OutboxEventData>({
  eventId: { type: String, required: true, immutable: true, unique: true }, eventType: { type: String, required: true, immutable: true },
  eventVersion: { type: Number, required: true, enum: [1], immutable: true }, sourceService: { type: String, required: true, immutable: true },
  aggregateId: { type: String, required: true, immutable: true }, recipientUserId: { type: String, match: /^[a-f0-9]{24}$/ },
  occurredAt: { type: Date, required: true, immutable: true }, payload: { type: Schema.Types.Mixed, required: true, immutable: true },
  status: { type: String, enum: ['pending', 'publishing', 'published', 'failed'], default: 'pending' }, attempts: { type: Number, default: 0, min: 0 },
  leaseId: String, lockedUntil: Date, nextAttemptAt: { type: Date, default: Date.now }, lastError: { type: String, maxlength: 500 }, publishedAt: Date,
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'hydration_outbox' });
outboxSchema.index({ status: 1, nextAttemptAt: 1, lockedUntil: 1 });
