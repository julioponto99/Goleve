import { Schema } from 'mongoose';
export type PerformanceGoalKind = 'weight' | 'steps' | 'waist' | 'heart_rate';
export interface PerformanceGoalData { ownerId: string; kind: PerformanceGoalKind; target: number; unit: 'kg' | 'steps' | 'cm' | 'bpm'; timezone: string; version: number; createdAt: Date; updatedAt: Date }
export const goalSchema = new Schema<PerformanceGoalData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  kind: { type: String, enum: ['weight', 'steps', 'waist', 'heart_rate'], required: true },
  target: { type: Number, required: true, min: 0.01, max: 100000 },
  unit: { type: String, enum: ['kg', 'steps', 'cm', 'bpm'], required: true },
  timezone: { type: String, required: true, maxlength: 64 }, version: { type: Number, default: 1, min: 1 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'performance_goals' });
goalSchema.index({ ownerId: 1, kind: 1 }, { unique: true });
