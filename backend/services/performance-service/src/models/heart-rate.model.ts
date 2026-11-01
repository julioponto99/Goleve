import { Schema } from 'mongoose';
export interface HeartRateData { ownerId: string; bpm: number; measuredAt: Date; timezone: string; context?: string; source: 'manual'; idempotencyKey?: string; createdAt: Date; updatedAt: Date }
export const heartRateSchema = new Schema<HeartRateData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  bpm: { type: Number, required: true, min: 20, max: 250 }, measuredAt: { type: Date, required: true },
  timezone: { type: String, required: true, maxlength: 64 }, context: { type: String, maxlength: 100 },
  source: { type: String, enum: ['manual'], default: 'manual' }, idempotencyKey: { type: String, minlength: 8, maxlength: 128 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'performance_heart_rates' });
heartRateSchema.index({ ownerId: 1, measuredAt: -1 });
heartRateSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
