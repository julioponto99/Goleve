import { Connection, Schema } from 'mongoose';
export const APPOINTMENT_TYPES = ['initial_session','one_off_session','follow_up'] as const;
export const APPOINTMENT_STATES = ['requested','accepted','declined','cancelled','expired','completed'] as const;
export type AppointmentType = typeof APPOINTMENT_TYPES[number];
export type AppointmentStatus = typeof APPOINTMENT_STATES[number];
export interface WindowConfiguration {
  timezone: string; sessionModes: string[]; environments: string[]; slotDurationMinutes: number;
  bufferBeforeMinutes: number; bufferAfterMinutes: number;
}
export interface RuleData extends WindowConfiguration {
  professionalAuthUserId: string; professionalId: string; capabilityId: string; weekday: number;
  localStartTime: string; localEndTime: string; validFrom: string; validUntil: string;
  dstDisambiguation?: 'earlier'|'later'; active: boolean; version: number; createdAt: Date; updatedAt: Date;
}
export interface ExceptionData extends WindowConfiguration {
  professionalAuthUserId: string; professionalId: string; capabilityId: string; startAtUtc: Date; endAtUtc: Date;
  type: 'block'|'extra_availability'|'replacement'; replacesRuleId?: string; reasonCode: string; active: boolean; version: number; createdAt: Date; updatedAt: Date;
}
export interface AppointmentData {
  serviceId?: string; billingRootId?: string;
  appointmentType: AppointmentType; subjectAuthUserId: string; professionalAuthUserId: string; professionalId: string; capabilityId: string;
  relationshipId?: string; mode: string; environment?: string; startAtUtc: Date; endAtUtc: Date; timezone: string;
  occupiedStartAtUtc: Date; occupiedEndAtUtc: Date; bufferBeforeMinutes: number; bufferAfterMinutes: number; availabilitySourceId: string;
  expiresAtUtc: Date; status: AppointmentStatus; version: number; rescheduleOfId?: string; rescheduledToId?: string;
  acceptedAt?: Date; closedAt?: Date; reasonCode?: string; createdAt: Date; updatedAt: Date;
}
export interface HistoryData { appointmentId: string; version: number; from?: string; to: string; action: string; actorId?: string; actorType: string; occurredAt: Date; reasonCode: string; eventId: string }
export interface OutboxData { eventId: string; type: string; appointmentId: string; aggregateVersion: number; occurredAt: Date;
  status: string; attempts: number; nextAttemptAt: Date; leaseId?: string; lockedUntil?: Date; publishedAt?: Date; lastErrorCode?: string; createdAt: Date; updatedAt: Date }
const id = { type: String, required: true, match: /^[a-f0-9]{24}$/ };
const owner = { professionalAuthUserId: { ...id, immutable: true }, professionalId: { ...id, immutable: true }, capabilityId: { ...id, immutable: true } };
const version = { type: Number, required: true, default: 1, min: 1, validate: Number.isSafeInteger };
const options = { strict: 'throw' as const, timestamps: true, versionKey: false as const, bufferCommands: false };
const windowFields = {
  timezone: { type: String, required: true, maxlength: 64 },
  sessionModes: { type: [String], required: true, enum: ['online','in_person'], validate: (a: string[]) => a.length >= 1 && a.length <= 2 },
  environments: { type: [String], required: true, enum: ['home','gym','outdoor'], validate: (a: string[]) => a.length <= 3 },
  slotDurationMinutes: { type: Number, required: true, enum: [30,45,60,90] },
  bufferBeforeMinutes: { type: Number, required: true, min: 0, max: 120, validate: Number.isSafeInteger },
  bufferAfterMinutes: { type: Number, required: true, min: 0, max: 120, validate: Number.isSafeInteger },
};
export const availabilityRuleSchema = new Schema<RuleData>({
  ...owner, ...windowFields, weekday: { type: Number, required: true, min: 0, max: 6, validate: Number.isSafeInteger },
  localStartTime: { type: String, required: true }, localEndTime: { type: String, required: true }, validFrom: { type: String, required: true }, validUntil: { type: String, required: true },
  dstDisambiguation: { type: String, enum: ['earlier','later'] }, active: { type: Boolean, required: true, default: true }, version,
}, { ...options, collection: 'agenda_professional_availability_rules' });
availabilityRuleSchema.index({ professionalAuthUserId: 1, active: 1, capabilityId: 1 });
export const availabilityExceptionSchema = new Schema<ExceptionData>({
  ...owner, ...windowFields, type: { type: String, required: true, enum: ['block','extra_availability','replacement'] },
  startAtUtc: { type: Date, required: true }, endAtUtc: { type: Date, required: true }, replacesRuleId: { type: String, match: /^[a-f0-9]{24}$/ },
  reasonCode: { type: String, required: true, enum: ['unavailable','schedule_adjustment','additional_hours'] }, active: { type: Boolean, required: true, default: true }, version,
}, { ...options, collection: 'agenda_professional_availability_exceptions' });
availabilityExceptionSchema.index({ professionalAuthUserId: 1, active: 1, startAtUtc: 1, endAtUtc: 1 });
export const appointmentSchema = new Schema<AppointmentData>({
  serviceId:{type:String,match:/^[a-f0-9]{24}$/},billingRootId:{type:String,match:/^[a-f0-9]{24}$/},
  ...owner, appointmentType: { type: String, required: true, immutable: true, enum: APPOINTMENT_TYPES }, subjectAuthUserId: { ...id, immutable: true },
  relationshipId: { type: String, immutable: true, match: /^[a-f0-9]{24}$/ }, mode: { type: String, required: true, enum: ['online','in_person'] }, environment: { type: String, enum: ['home','gym','outdoor'] },
  startAtUtc: { type: Date, required: true, immutable: true }, endAtUtc: { type: Date, required: true, immutable: true }, timezone: { type: String, required: true },
  occupiedStartAtUtc: { type: Date, required: true, immutable: true }, occupiedEndAtUtc: { type: Date, required: true, immutable: true },
  bufferBeforeMinutes: { type: Number, required: true, immutable: true }, bufferAfterMinutes: { type: Number, required: true, immutable: true }, availabilitySourceId: { ...id, immutable: true },
  expiresAtUtc: { type: Date, required: true, immutable: true }, status: { type: String, required: true, enum: APPOINTMENT_STATES }, version,
  rescheduleOfId: { type: String, immutable: true, match: /^[a-f0-9]{24}$/ }, rescheduledToId: { type: String, match: /^[a-f0-9]{24}$/ },
  acceptedAt: Date, closedAt: Date, reasonCode: String,
}, { ...options, collection: 'agenda_professional_appointments' });
appointmentSchema.index({ professionalAuthUserId: 1, status: 1, occupiedStartAtUtc: 1, occupiedEndAtUtc: 1 });
appointmentSchema.index({ subjectAuthUserId: 1, startAtUtc: 1, _id: 1 });
appointmentSchema.index({ professionalAuthUserId: 1, startAtUtc: 1, _id: 1 });
appointmentSchema.index({ status: 1, expiresAtUtc: 1 });
appointmentSchema.index({ rescheduleOfId: 1, status: 1, expiresAtUtc: 1 });
const calendarSchema = new Schema<{ _id: string; version: number }>({ _id: { type: String, required: true, match: /^[a-f0-9]{24}$/ }, version: { type: Number, required: true, min: 0 } }, { ...options, collection: 'agenda_professional_calendars' });
const historySchema = new Schema<HistoryData>({ appointmentId: id, version, from: String, to: { type: String, required: true }, action: { type: String, required: true },
  actorId: { type: String, match: /^[a-f0-9]{24}$/ }, actorType: { type: String, required: true, enum: ['subject','professional','system'] }, occurredAt: { type: Date, required: true }, reasonCode: { type: String, required: true }, eventId: { type: String, required: true } },
  { strict: 'throw', versionKey: false, bufferCommands: false, collection: 'agenda_professional_history' });
historySchema.index({ appointmentId: 1, version: 1 }, { unique: true });
const commandSchema = new Schema<{ actorId: string; keyHash: string; fingerprint: string; resourceId: string; resourceType: string }>({ actorId: id, keyHash: { type: String, required: true }, fingerprint: { type: String, required: true }, resourceId: id, resourceType: { type: String, required: true, enum: ['rule','exception','appointment'] } }, { ...options, collection: 'agenda_professional_commands' });
commandSchema.index({ actorId: 1, keyHash: 1 }, { unique: true });
const auditSchema = new Schema({ resourceId:id,resourceType:{type:String,required:true,enum:['rule','exception','appointment']},version,
  action:{type:String,required:true},actorId:{type:String,match:/^[a-f0-9]{24}$/},requestId:{type:String,required:true},occurredAt:{type:Date,required:true} },
  {strict:'throw',versionKey:false,bufferCommands:false,collection:'agenda_professional_audit'});
auditSchema.index({resourceType:1,resourceId:1,version:1});
const outboxSchema = new Schema<OutboxData>({ eventId: { type: String, required: true, immutable: true }, type: { type: String, required: true, immutable: true }, appointmentId: { ...id, immutable: true }, aggregateVersion: version,
  occurredAt: { type: Date, required: true, immutable: true }, status: { type: String, required: true, enum: ['pending','publishing','published','dead'] }, attempts: { type: Number, required: true, min: 0 },
  nextAttemptAt: { type: Date, required: true }, leaseId: String, lockedUntil: Date, publishedAt: Date, lastErrorCode: String }, { ...options, collection: 'agenda_professional_outbox' });
outboxSchema.index({ eventId: 1 }, { unique: true }); outboxSchema.index({ status: 1, nextAttemptAt: 1, lockedUntil: 1 });
export function createProfessionalAgendaModels(connection: Connection) {
  return { Rule: connection.model('AgendaProfessionalRule', availabilityRuleSchema), Exception: connection.model('AgendaProfessionalException', availabilityExceptionSchema),
    Appointment: connection.model('AgendaProfessionalAppointment', appointmentSchema), Calendar: connection.model('AgendaProfessionalCalendar', calendarSchema),
    History: connection.model('AgendaProfessionalHistory', historySchema), Command: connection.model('AgendaProfessionalCommand', commandSchema), Audit: connection.model('AgendaProfessionalAudit', auditSchema), Outbox: connection.model('AgendaProfessionalOutbox', outboxSchema) };
}
export type ProfessionalAgendaModels = ReturnType<typeof createProfessionalAgendaModels>;
export async function initializeProfessionalAgendaModels(models: ProfessionalAgendaModels) { await Promise.all(Object.values(models).map(m => m.init())); }
