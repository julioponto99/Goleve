import { Schema } from 'mongoose';

export type ActivityStatus = 'planned' | 'completed' | 'cancelled';
export type ActivityKind = 'personal' | 'workout';
export type WorkoutEnvironment = 'home' | 'gym' | 'outdoor';
export interface ActivityData {
  authUserId: string; title: string; description?: string; kind: ActivityKind;
  environment?: WorkoutEnvironment; startAt: Date; endAt: Date; timezone: string;
  status: ActivityStatus; version: number; completedAt?: Date; cancelledAt?: Date;
  createdAt: Date; updatedAt: Date;
}

export const activitySchema = new Schema<ActivityData>({
  authUserId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  title: { type: String, required: true, trim: true, minlength: 1, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000 },
  kind: { type: String, required: true, enum: ['personal', 'workout'] },
  environment: { type: String, enum: ['home', 'gym', 'outdoor'] },
  startAt: { type: Date, required: true }, endAt: { type: Date, required: true },
  timezone: { type: String, required: true, maxlength: 64 },
  status: { type: String, required: true, enum: ['planned', 'completed', 'cancelled'], default: 'planned' },
  version: { type: Number, required: true, default: 1, min: 1 },
  completedAt: Date, cancelledAt: Date,
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'agenda_activities' });
activitySchema.index({ authUserId: 1, startAt: 1 });
activitySchema.index({ authUserId: 1, status: 1, startAt: 1 });
activitySchema.index({ authUserId: 1, endAt: 1 });
activitySchema.pre('save', function () {
  if (this.endAt <= this.startAt) throw new Error('endAt must be after startAt');
  if (this.kind === 'workout' && !this.environment) throw new Error('Workout environment is required');
  if (this.kind === 'personal' && this.environment) throw new Error('Personal activities cannot have a workout environment');
});
