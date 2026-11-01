import { Schema } from 'mongoose';
export const auditSchema = new Schema({
  eventId: { type: String, required: true },
  requestId: { type: String, required: true },
  actorId: { type: String, required: true, match: /^[a-f0-9]{24}$/ },
  subjectAuthUserId: { type: String, required: true, match: /^[a-f0-9]{24}$/ },
  resourceType: { type: String, required: true, enum: ['profile', 'preferences', 'habits', 'measurements', 'goals', 'physical_data'] },
  actionCode: { type: String, required: true, enum: ['read', 'create', 'update'] },
  decision: { type: String, required: true, enum: ['intent', 'allowed', 'failed'] },
  resourceOpaqueId: { type: String },
  resourceVersion: { type: Number },
  occurredAt: { type: Date, required: true },
  dataMode: { type: String, required: true, enum: ['synthetic'] },
}, { collection: 'audit_access_records', versionKey: false, strict: 'throw', bufferCommands: false });
auditSchema.index({ eventId: 1 }, { unique: true });
auditSchema.index({ subjectAuthUserId: 1, occurredAt: -1, _id: -1 });
