import { Schema, Types } from 'mongoose';
import { QUALIFICATION_TYPES } from '../config/catalog';
import { OwnedData, ownedFields, schemaOptions } from './common';
export interface QualificationData extends OwnedData {
  professionalId: Types.ObjectId; capabilityId?: Types.ObjectId;
  qualificationType: string; title: string; issuerName: string; awardedOn?: string; expiresOn?: string;
  specializationCodes: string[]; verificationStatus: string; publishSummary: boolean;
  idempotencyKey: string; inputFingerprint: string;
}
export const qualificationSchema = new Schema<QualificationData>({
  ...ownedFields,
  professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  capabilityId: { type: Schema.Types.ObjectId, immutable: true },
  qualificationType: { type: String, required: true, enum: QUALIFICATION_TYPES },
  title: { type: String, required: true, minlength: 2, maxlength: 200 },
  issuerName: { type: String, required: true, minlength: 2, maxlength: 200 },
  awardedOn: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ }, expiresOn: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
  specializationCodes: { type: [String], default: [], validate: (v: string[]) => v.length <= 10 },
  verificationStatus: { type: String, required: true, default: 'unverified', enum: ['unverified', 'verified', 'rejected'] },
  publishSummary: { type: Boolean, required: true, default: false },
  idempotencyKey: { type: String, required: true, select: false },
  inputFingerprint: { type: String, required: true, select: false },
}, { ...schemaOptions, collection: 'professional_qualifications' });
qualificationSchema.index({ authUserId: 1, professionalId: 1, _id: -1 });
qualificationSchema.index({ professionalId: 1, capabilityId: 1, verificationStatus: 1 });
qualificationSchema.index({ authUserId: 1, idempotencyKey: 1 }, { unique: true });
