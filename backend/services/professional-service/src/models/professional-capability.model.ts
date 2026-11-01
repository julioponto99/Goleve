import { Schema, Types } from 'mongoose';
import { CapabilityKind, CAPABILITY_KINDS, SERVICE_MODES } from '../config/catalog';
import { OwnedData, ownedFields, schemaOptions } from './common';
export interface CapabilityData extends OwnedData {
  professionalId: Types.ObjectId; kind: CapabilityKind; jurisdictionCountry: string;
  specializations: string[]; experienceStartYear?: number; serviceModes: string[];
  titleRequirement: string; requirementPolicyVersion: string; status: string;
}
export const capabilitySchema = new Schema<CapabilityData>({
  ...ownedFields,
  professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  kind: { type: String, required: true, immutable: true, enum: CAPABILITY_KINDS },
  jurisdictionCountry: { type: String, required: true, immutable: true, match: /^[A-Z]{2}$/ },
  specializations: { type: [String], default: [], validate: (v: string[]) => v.length <= 20 },
  experienceStartYear: { type: Number, validate: Number.isSafeInteger },
  serviceModes: { type: [String], required: true, enum: SERVICE_MODES, validate: (v: string[]) => v.length >= 1 && v.length <= 3 },
  titleRequirement: { type: String, required: true, default: 'pending_legal_assessment', enum: ['pending_legal_assessment'] },
  requirementPolicyVersion: { type: String, required: true, default: 'synthetic-unassessed-v1', enum: ['synthetic-unassessed-v1'] },
  status: { type: String, required: true, default: 'draft', enum: ['draft', 'pending', 'verified', 'suspended', 'expired', 'rejected'] },
}, { ...schemaOptions, collection: 'professional_capabilities' });
capabilitySchema.index({ professionalId: 1, kind: 1, jurisdictionCountry: 1 }, { unique: true });
capabilitySchema.index({ authUserId: 1, professionalId: 1, _id: -1 });
