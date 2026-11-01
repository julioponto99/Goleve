import { Schema } from 'mongoose';

export type MeasurementKind = 'weight' | 'height' | 'waist' | 'hip' | 'chest' | 'arm' | 'thigh' | 'other';
export interface MeasurementData { ownerId: string; kind: MeasurementKind; value: number; unit: 'kg' | 'cm'; measuredAt: Date; timezone: string; source: 'manual'; idempotencyKey?: string; createdAt: Date; updatedAt: Date }
export const measurementSchema = new Schema<MeasurementData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  kind: { type: String, enum: ['weight', 'height', 'waist', 'hip', 'chest', 'arm', 'thigh', 'other'], required: true },
  value: { type: Number, required: true, min: 0.01, max: 1000 },
  unit: { type: String, enum: ['kg', 'cm'], required: true },
  measuredAt: { type: Date, required: true }, timezone: { type: String, required: true, maxlength: 64 },
  source: { type: String, enum: ['manual'], default: 'manual' }, idempotencyKey: { type: String, minlength: 8, maxlength: 128 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'performance_measurements' });
measurementSchema.index({ ownerId: 1, kind: 1, measuredAt: -1 });
measurementSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
