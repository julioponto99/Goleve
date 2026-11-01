import { Schema, Types } from 'mongoose';
import { TrainingEnvironment } from './exercise.model';

export interface PlanExercise {
  exerciseId: Types.ObjectId;
  sets?: number;
  repetitions?: number;
  load?: number;
  durationSeconds?: number;
  restSeconds?: number;
  day?: string;
}
export interface PlanSnapshot {
  version: number;
  title: string;
  description?: string;
  goals: string[];
  days: string[];
  environment?: TrainingEnvironment;
  exercises: PlanExercise[];
  changedAt: Date;
}
export interface TrainingPlanData {
  ownerId: string;
  title: string;
  description?: string;
  goals: string[];
  days: string[];
  environment?: TrainingEnvironment;
  exercises: PlanExercise[];
  status: 'active' | 'archived';
  version: number;
  history: PlanSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}

const planExerciseSchema = new Schema<PlanExercise>({
  exerciseId: { type: Schema.Types.ObjectId, required: true },
  sets: { type: Number, min: 1, max: 100 },
  repetitions: { type: Number, min: 1, max: 1000 },
  load: { type: Number, min: 0, max: 100000 },
  durationSeconds: { type: Number, min: 1, max: 86400 },
  restSeconds: { type: Number, min: 0, max: 86400 },
  day: { type: String, trim: true, maxlength: 30 },
}, { _id: false, strict: 'throw' });

export const planSchema = new Schema<TrainingPlanData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  goals: { type: [String], default: [], validate: [(v: string[]) => v.length <= 20, 'Too many goals'] },
  days: { type: [String], default: [], validate: [(v: string[]) => v.length <= 14, 'Too many days'] },
  environment: { type: String, enum: ['home', 'gym', 'outdoor'] },
  exercises: { type: [planExerciseSchema], default: [] },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  version: { type: Number, default: 1, min: 1 },
  history: { type: [new Schema<PlanSnapshot>({
    version: { type: Number, required: true }, title: { type: String, required: true },
    description: String, goals: { type: [String], default: [] }, days: { type: [String], default: [] },
    environment: { type: String, enum: ['home', 'gym', 'outdoor'] }, exercises: { type: [planExerciseSchema], default: [] },
    changedAt: { type: Date, required: true },
  }, { _id: false, strict: 'throw' })], default: [] },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'training_plans' });
planSchema.index({ ownerId: 1, status: 1, updatedAt: -1 });
