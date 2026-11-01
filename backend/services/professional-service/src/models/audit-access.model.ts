import { Schema } from 'mongoose';
export const auditSchema = new Schema({
  eventId: { type: String, required: true }, requestId: { type: String, required: true },
  actorId: { type: String, required: true, match: /^[a-f0-9]{24}$/ },
  purposeCode: { type: String, required: true, enum: ['synthetic_self_application', 'synthetic_application_review', 'synthetic_relationship'] },
  resourceType: { type: String, required: true, enum: ['profile', 'capability', 'qualification', 'availability', 'application', 'relationship'] },
  actionCode: { type: String, required: true, enum: ['read', 'create', 'update'] },
  decision: { type: String, required: true, enum: ['intent', 'allowed', 'failed'] },
  resourceOpaqueId: String, resourceVersion: Number,
  occurredAt: { type: Date, required: true }, dataMode: { type: String, required: true, enum: ['synthetic'] },
}, { collection: 'professional_audit_records', strict: 'throw', versionKey: false, bufferCommands: false });
auditSchema.index({ eventId: 1 }, { unique: true });
auditSchema.index({ actorId: 1, occurredAt: -1, _id: -1 });
