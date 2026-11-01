import { Schema } from 'mongoose';
import { EncryptionEnvelope } from '../config/encryption';
import { envelopeSchema, OwnedData, ownedFields, schemaOptions } from './common';

export interface HabitData extends OwnedData {
  payloadEncrypted: EncryptionEnvelope;
  declaredAt: Date;
  source: string;
}
export const habitSchema = new Schema<HabitData>({
  ...ownedFields,
  payloadEncrypted: { type: envelopeSchema, required: true, select: false },
  declaredAt: { type: Date, required: true },
  source: { type: String, required: true, enum: ['self_reported'] },
}, { ...schemaOptions, collection: 'habit_profiles' });
habitSchema.index({ authUserId: 1 }, { unique: true });
