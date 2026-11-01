import { Schema } from 'mongoose';

export type GoalSource = 'suggested' | 'custom';
export interface GoalHistoryEntry {
  version: number;
  targetMl: number;
  source: GoalSource;
  timezone: string;
  changedAt: Date;
}
export interface HydrationGoalData {
  ownerId: string;
  targetMl: number;
  source: GoalSource;
  timezone: string;
  version: number;
  history: GoalHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<GoalHistoryEntry>({
  version: { type: Number, required: true },
  targetMl: { type: Number, required: true, min: 250, max: 20000 },
  source: { type: String, enum: ['suggested', 'custom'], required: true },
  timezone: { type: String, required: true, maxlength: 64 },
  changedAt: { type: Date, required: true },
}, { _id: false, strict: 'throw' });

export const goalSchema = new Schema<HydrationGoalData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  targetMl: { type: Number, required: true, min: 250, max: 20000 },
  source: { type: String, enum: ['suggested', 'custom'], required: true },
  timezone: { type: String, required: true, maxlength: 64 },
  version: { type: Number, required: true, default: 1, min: 1 },
  history: { type: [historySchema], default: [] },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'hydration_goals' });
goalSchema.index({ ownerId: 1 }, { unique: true });
