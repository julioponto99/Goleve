import { Schema, Types } from 'mongoose';

export interface PerformedExercise {
  exerciseId: Types.ObjectId;
  sets: Array<{ repetitions?: number; load?: number; durationSeconds?: number }>;
  notes?: string;
}
export interface TrainingSessionData {
  ownerId: string;
  planId?: Types.ObjectId;
  status: 'planned' | 'running' | 'paused' | 'completed' | 'cancelled';
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  exercises: PerformedExercise[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const performedSchema = new Schema<PerformedExercise>({
  exerciseId: { type: Schema.Types.ObjectId, required: true },
  sets: { type: [{ repetitions: { type: Number, min: 1 }, load: { type: Number, min: 0 }, durationSeconds: { type: Number, min: 1 } }], default: [] },
  notes: { type: String, maxlength: 2000 },
}, { _id: false, strict: 'throw' });

export const sessionSchema = new Schema<TrainingSessionData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  planId: Schema.Types.ObjectId,
  status: { type: String, enum: ['planned', 'running', 'paused', 'completed', 'cancelled'], default: 'planned' },
  startedAt: Date, pausedAt: Date, completedAt: Date,
  durationSeconds: { type: Number, min: 0 },
  exercises: { type: [performedSchema], default: [] },
  version: { type: Number, default: 1, min: 1 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'training_sessions' });
sessionSchema.index({ ownerId: 1, createdAt: -1 });
sessionSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
