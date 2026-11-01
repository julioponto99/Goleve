import { Schema } from 'mongoose';
import { EncryptionEnvelope } from '../config/encryption';
import { envelopeSchema, OwnedData, ownedFields, schemaOptions } from './common';

export const MEASUREMENT_KINDS = ['weight', 'height', 'waist', 'hip', 'chest', 'upper_arm', 'thigh', 'calf'] as const;
export interface MeasurementData extends OwnedData {
  kind: string;
  unit: string;
  value: EncryptionEnvelope;
  measuredAt: Date;
  recordedAt: Date;
  recordedByAuthUserId: string;
  source: string;
  status: string;
  idempotencyKey: string;
  inputFingerprint: string;
}
export const measurementSchema = new Schema<MeasurementData>({
  ...ownedFields,
  kind: { type: String, required: true, enum: MEASUREMENT_KINDS },
  unit: { type: String, required: true, enum: ['g', 'mm'] },
  value: { type: envelopeSchema, required: true, select: false },
  measuredAt: { type: Date, required: true },
  recordedAt: { type: Date, required: true },
  recordedByAuthUserId: { type: String, required: true, match: /^[a-f0-9]{24}$/ },
  source: { type: String, required: true, enum: ['self'] },
  status: { type: String, required: true, enum: ['valid'], default: 'valid' },
  idempotencyKey: { type: String, required: true, maxlength: 128, select: false },
  inputFingerprint: { type: String, required: true, select: false },
}, { ...schemaOptions, collection: 'body_measurements' });
measurementSchema.index({ authUserId: 1, kind: 1, measuredAt: -1, _id: -1 });
measurementSchema.index({ authUserId: 1, measuredAt: -1, _id: -1 });
measurementSchema.index({ authUserId: 1, idempotencyKey: 1 }, { unique: true });
