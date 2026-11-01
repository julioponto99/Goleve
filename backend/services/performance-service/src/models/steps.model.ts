import { Schema } from 'mongoose';
export interface StepsData { ownerId: string; count: number; recordedAt: Date; timezone: string; localDate: string; source: 'manual' | 'apple_health' | 'health_connect'; idempotencyKey?: string; createdAt: Date; updatedAt: Date }
export const stepsSchema = new Schema<StepsData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  count: { type: Number, required: true, min: 0, max: 200000 }, recordedAt: { type: Date, required: true },
  timezone: { type: String, required: true, maxlength: 64 }, localDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  source: { type: String, enum: ['manual', 'apple_health', 'health_connect'], default: 'manual' }, idempotencyKey: { type: String, minlength: 8, maxlength: 128 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'performance_steps' });
stepsSchema.index({ ownerId: 1, localDate: 1, recordedAt: -1 });
stepsSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
