import { Schema } from 'mongoose';

export type TrainingEnvironment = 'home' | 'gym' | 'outdoor';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'flexibility' | 'balance';

export interface ExerciseData {
  ownerId?: string;
  name: string;
  description?: string;
  muscleGroup: string;
  equipment: string[];
  environments: TrainingEnvironment[];
  difficulty: Difficulty;
  type: ExerciseType;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

export const exerciseSchema = new Schema<ExerciseData>({
  ownerId: { type: String, match: /^[a-f0-9]{24}$/ },
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  muscleGroup: { type: String, required: true, trim: true, maxlength: 80 },
  equipment: { type: [String], required: true, validate: [(v: string[]) => v.length <= 20, 'Too many equipment items'] },
  environments: { type: [String], required: true, enum: ['home', 'gym', 'outdoor'] },
  difficulty: { type: String, required: true, enum: ['beginner', 'intermediate', 'advanced'] },
  type: { type: String, required: true, enum: ['strength', 'cardio', 'mobility', 'flexibility', 'balance'] },
  instructions: { type: String, required: true, trim: true, maxlength: 4000 },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'training_exercises' });
exerciseSchema.index({ ownerId: 1, name: 1 });
exerciseSchema.index({ environments: 1, difficulty: 1, muscleGroup: 1 });
