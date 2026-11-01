import { Schema, Types } from 'mongoose';
import { schemaOptions } from './common';
export const RELATIONSHIP_STATES = ['pending', 'accepted', 'declined', 'cancelled', 'ended', 'expired'] as const;
export type RelationshipState = typeof RELATIONSHIP_STATES[number];
export const RELATIONSHIP_KINDS = ['personal_training', 'nutrition'] as const;
export type RelationshipKind = typeof RELATIONSHIP_KINDS[number];
export type RelationshipAction = 'created' | 'accept' | 'decline' | 'cancel' | 'end' | 'expire';
export interface RelationshipTransition {
  eventId: string; relationshipVersion: number; action: RelationshipAction;
  from?: RelationshipState; to: RelationshipState; actorType: 'requester' | 'professional' | 'system';
  actorAuthUserId?: string; occurredAt: Date; requestId: string; reasonCode: string;
  commandKeyHash?: string; commandFingerprint?: string;
}
export interface CareRelationshipData {
  subjectAuthUserId: string; professionalAuthUserId: string; professionalId: Types.ObjectId; capabilityId: Types.ObjectId;
  relationshipKind: RelationshipKind; status: RelationshipState; isOpen: boolean; version: number; schemaVersion: number;
  dataMode: string; termsVersion: string; createdAt: Date; updatedAt: Date; expiresAt: Date;
  acceptedAt?: Date; closedAt?: Date; history: RelationshipTransition[];
  creationKeyHash: string; creationFingerprint: string;
}
const transition = new Schema({
  eventId: { type: String, required: true }, relationshipVersion: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  action: { type: String, required: true, enum: ['created', 'accept', 'decline', 'cancel', 'end', 'expire'] },
  from: { type: String, enum: RELATIONSHIP_STATES }, to: { type: String, required: true, enum: RELATIONSHIP_STATES },
  actorType: { type: String, required: true, enum: ['requester', 'professional', 'system'] },
  actorAuthUserId: { type: String, match: /^[a-f0-9]{24}$/ }, occurredAt: { type: Date, required: true },
  requestId: { type: String, required: true }, reasonCode: { type: String, required: true,
    enum: ['request_created', 'professional_accepted', 'professional_declined', 'requester_cancelled', 'participant_ended', 'invitation_expired'] },
  commandKeyHash: String, commandFingerprint: String,
}, { _id: false, strict: 'throw' });
export const relationshipSchema = new Schema<CareRelationshipData>({
  subjectAuthUserId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  professionalAuthUserId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  professionalId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  capabilityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  relationshipKind: { type: String, required: true, immutable: true, enum: RELATIONSHIP_KINDS },
  status: { type: String, required: true, enum: RELATIONSHIP_STATES }, isOpen: { type: Boolean, required: true },
  version: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  schemaVersion: { type: Number, required: true, default: 1, enum: [1] },
  dataMode: { type: String, required: true, default: 'synthetic', enum: ['synthetic'], immutable: true },
  termsVersion: { type: String, required: true, default: 'synthetic-workflow-v1', enum: ['synthetic-workflow-v1'] },
  expiresAt: { type: Date, required: true, immutable: true }, acceptedAt: Date, closedAt: Date,
  history: { type: [transition], required: true, select: false, validate: (v: unknown[]) => v.length >= 1 && v.length <= 8 },
  creationKeyHash: { type: String, required: true, select: false, immutable: true },
  creationFingerprint: { type: String, required: true, select: false, immutable: true },
}, { ...schemaOptions, collection: 'care_relationships' });
// Uniqueness is by activity kind, including different jurisdictions/capabilities.
relationshipSchema.index({ subjectAuthUserId: 1, professionalId: 1, relationshipKind: 1 }, { unique: true, partialFilterExpression: { isOpen: true } });
relationshipSchema.index({ subjectAuthUserId: 1, creationKeyHash: 1 }, { unique: true });
relationshipSchema.index({ subjectAuthUserId: 1, status: 1, _id: -1 });
relationshipSchema.index({ professionalAuthUserId: 1, capabilityId: 1, status: 1, _id: -1 });
relationshipSchema.index({ status: 1, expiresAt: 1, _id: 1 });
