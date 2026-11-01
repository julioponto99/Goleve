import { Schema } from 'mongoose';
import { EncryptionEnvelope } from '../config/encryption';
import { envelopeSchema, OwnedData, ownedFields, schemaOptions } from './common';

export const GOAL_TYPES = ['weight_loss', 'weight_maintenance', 'muscle_gain', 'fitness', 'hydration', 'daily_activity', 'custom'] as const;
export const GOAL_STATUSES = ['proposed', 'active', 'paused', 'achieved', 'archived'] as const;
export interface GoalData extends OwnedData {
  goalType: string;
  status: string;
  payloadEncrypted: EncryptionEnvelope;
  createdByAuthUserId: string;
}
export const goalSchema = new Schema<GoalData>({
  ...ownedFields,
  goalType: { type: String, required: true, enum: GOAL_TYPES },
  status: { type: String, required: true, enum: GOAL_STATUSES },
  payloadEncrypted: { type: envelopeSchema, required: true, select: false },
  createdByAuthUserId: { type: String, required: true, match: /^[a-f0-9]{24}$/ },
}, { ...schemaOptions, collection: 'user_goals' });
goalSchema.index({ authUserId: 1, status: 1, goalType: 1, createdAt: -1, _id: -1 });
