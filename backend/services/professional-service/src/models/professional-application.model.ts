import { Schema, Types } from 'mongoose';
import { OwnedData, ownedFields, schemaOptions } from './common';
import { CAPABILITY_KINDS, SERVICE_MODES, QUALIFICATION_TYPES } from '../config/catalog';
export const APPLICATION_STATES = ['draft', 'pending', 'approved', 'rejected', 'suspended'] as const;
export type ApplicationState = typeof APPLICATION_STATES[number];
export type ApplicationAction = 'submit' | 'reopen' | 'approve' | 'reject' | 'suspend';
export interface SubmittedCapability {
  id: string; kind: string; jurisdictionCountry: string; specializations: string[];
  experienceStartYear?: number; serviceModes: string[];
}
export interface SubmittedQualification {
  id: string; capabilityId?: string; qualificationType: string; title: string; issuerName: string;
  awardedOn?: string; expiresOn?: string;
}
export interface ApplicationSnapshot {
  profile: { professionalName: string; biography?: string; countryCode: string; languages: string[] };
  capabilities: SubmittedCapability[]; qualifications: SubmittedQualification[];
  publicationRequested: boolean; publicQualificationIds: string[]; submittedProfileVersion: number;
}
export interface ApplicationEvent {
  eventId: string; version: number; action: ApplicationAction; from: ApplicationState; to: ApplicationState;
  actorAuthUserId: string; occurredAt: Date; reason?: string; commandKeyHash: string; commandFingerprint: string;
}
export interface ApplicationData extends OwnedData {
  professionalId: Types.ObjectId; status: ApplicationState; snapshot: ApplicationSnapshot;
  history: ApplicationEvent[]; publicationEnabled: boolean; submittedAt: Date;
  lastDecision?: { action: string; actorAuthUserId: string; occurredAt: Date; reason?: string };
}
const options = { _id: false, strict: 'throw' as const };
const profile = new Schema({ professionalName: { type: String, required: true, maxlength: 150 },
  biography: { type: String, maxlength: 2000 }, countryCode: { type: String, required: true },
  languages: { type: [String], required: true, validate: (v: string[]) => v.length >= 1 && v.length <= 10 } }, options);
const capability = new Schema({ id: { type: String, required: true }, kind: { type: String, required: true, enum: CAPABILITY_KINDS },
  jurisdictionCountry: { type: String, required: true }, specializations: { type: [String], default: [], validate: (v: string[]) => v.length <= 20 },
  experienceStartYear: Number, serviceModes: { type: [String], enum: SERVICE_MODES, required: true } }, options);
const qualification = new Schema({ id: { type: String, required: true }, capabilityId: String,
  qualificationType: { type: String, required: true, enum: QUALIFICATION_TYPES }, title: { type: String, required: true, maxlength: 200 },
  issuerName: { type: String, required: true, maxlength: 200 }, awardedOn: String, expiresOn: String }, options);
const snapshot = new Schema({ profile: { type: profile, required: true },
  capabilities: { type: [capability], required: true, validate: (v: unknown[]) => v.length >= 1 && v.length <= 20 },
  qualifications: { type: [qualification], required: true, validate: (v: unknown[]) => v.length >= 1 && v.length <= 50 },
  publicationRequested: { type: Boolean, required: true }, publicQualificationIds: { type: [String], default: [], validate: (v: string[]) => v.length <= 20 },
  submittedProfileVersion: { type: Number, required: true, min: 1 } }, options);
const event = new Schema({ eventId: { type: String, required: true }, version: { type: Number, required: true },
  action: { type: String, required: true, enum: ['submit', 'reopen', 'approve', 'reject', 'suspend'] },
  from: { type: String, required: true, enum: APPLICATION_STATES }, to: { type: String, required: true, enum: APPLICATION_STATES },
  actorAuthUserId: { type: String, required: true, match: /^[a-f0-9]{24}$/ }, occurredAt: { type: Date, required: true },
  reason: { type: String, maxlength: 500 }, commandKeyHash: { type: String, required: true }, commandFingerprint: { type: String, required: true } }, options);
const lastDecision = new Schema({ action: { type: String, required: true, enum: ['approve', 'reject', 'suspend'] },
  actorAuthUserId: { type: String, required: true }, occurredAt: { type: Date, required: true }, reason: { type: String, maxlength: 500 } }, options);
export const applicationSchema = new Schema<ApplicationData>({ ...ownedFields,
  professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  status: { type: String, required: true, enum: APPLICATION_STATES }, snapshot: { type: snapshot, required: true, select: false },
  history: { type: [event], required: true, select: false, validate: (v: unknown[]) => v.length >= 1 && v.length <= 50 },
  publicationEnabled: { type: Boolean, required: true, default: false }, submittedAt: { type: Date, required: true },
  lastDecision: { type: lastDecision, default: undefined },
}, { ...schemaOptions, collection: 'professional_applications' });
applicationSchema.index({ authUserId: 1 }, { unique: true });
applicationSchema.index({ professionalId: 1 }, { unique: true });
applicationSchema.index({ status: 1, publicationEnabled: 1, _id: -1 });
