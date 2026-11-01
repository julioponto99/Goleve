import { ApiError } from '../config/errors';
import { APPOINTMENT_TYPES, AppointmentType, WindowConfiguration } from './models';
import { dayRange, instant, localInstant, localParts, validDate, validZone } from './time';
export const fail = (status: number, code: string, message: string): never => { throw new ApiError(status, code, message); };
export const invalid = (message: string): never => fail(400, 'VALIDATION_ERROR', message);
export function object(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) return invalid('Unsupported fields or invalid object');
  return value as Record<string, unknown>;
}
export function objectId(value: unknown): string { if (typeof value !== 'string' || !/^[a-f0-9]{24}$/.test(value)) return invalid('Invalid identifier'); return value; }
export function integer(value: unknown, min: number, max: number) { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return invalid('Invalid integer'); return value; }
function choices(value: unknown, allowed: string[], min: number) {
  if (!Array.isArray(value) || value.length < min || value.length > allowed.length || value.some(v => typeof v !== 'string' || !allowed.includes(v)) || new Set(value).size !== value.length) return invalid('Invalid options');
  return value as string[];
}
export const windowKeys = ['timezone','sessionModes','environments','slotDurationMinutes','bufferBeforeMinutes','bufferAfterMinutes'] as const;
export function windowConfiguration(data: Record<string, unknown>): WindowConfiguration {
  const timezone = validZone(data.timezone), sessionModes = choices(data.sessionModes, ['online','in_person'], 1), environments = choices(data.environments ?? [], ['home','gym','outdoor'], 0);
  if (sessionModes.includes('in_person') !== (environments.length > 0)) return invalid('In-person availability requires environments; online-only availability cannot specify them');
  const duration = integer(data.slotDurationMinutes, 30, 90); if (![30,45,60,90].includes(duration)) return invalid('Duration must be 30, 45, 60 or 90 minutes');
  return { timezone, sessionModes, environments, slotDurationMinutes: duration,
    bufferBeforeMinutes: integer(data.bufferBeforeMinutes ?? 0, 0, 120), bufferAfterMinutes: integer(data.bufferAfterMinutes ?? 0, 0, 120) };
}
export const ruleKeys = ['capabilityId','weekday','localStartTime','localEndTime','validFrom','validUntil','dstDisambiguation',...windowKeys];
export function ruleInput(value: unknown) {
  const data = object(value, ruleKeys), config = windowConfiguration(data), weekday = integer(data.weekday, 0, 6);
  if (typeof data.localStartTime !== 'string' || typeof data.localEndTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.localStartTime)
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.localEndTime) || data.localEndTime <= data.localStartTime) return invalid('Use an increasing local interval within one day');
  if (!validDate(data.validFrom) || !validDate(data.validUntil) || data.validUntil < data.validFrom || Date.parse(data.validUntil) - Date.parse(data.validFrom) > 366 * 86400000) return invalid('Rule validity must be explicit and no longer than 366 days');
  if (data.dstDisambiguation !== undefined && !['earlier','later'].includes(String(data.dstDisambiguation))) return invalid('Invalid DST disambiguation');
  const dstDisambiguation = data.dstDisambiguation as 'earlier'|'later'|undefined;
  let occurrences = 0;
  for (const day of dayRange(new Date(data.validFrom), new Date(data.validUntil))) {
    if (day < data.validFrom || day > data.validUntil || new Date(day).getUTCDay() !== weekday) continue;
    const start = localInstant(day, data.localStartTime, config.timezone, dstDisambiguation), end = localInstant(day, data.localEndTime, config.timezone, dstDisambiguation);
    if (end.getTime() - start.getTime() < (config.slotDurationMinutes + config.bufferBeforeMinutes + config.bufferAfterMinutes) * 60000) return invalid('Availability interval is too short'); occurrences++;
  }
  if (!occurrences) return invalid('Rule has no occurrences in its validity period');
  return { ...config, capabilityId: objectId(data.capabilityId), weekday, localStartTime: data.localStartTime, localEndTime: data.localEndTime,
    validFrom: data.validFrom, validUntil: data.validUntil, ...(dstDisambiguation ? { dstDisambiguation } : {}) };
}
export function exceptionInput(value: unknown) {
  const data = object(value, ['capabilityId','type','startAtUtc','endAtUtc','replacesRuleId','reasonCode',...windowKeys]);
  if (!['block','extra_availability','replacement'].includes(String(data.type))) return invalid('Invalid exception type');
  const startAtUtc = instant(data.startAtUtc), endAtUtc = instant(data.endAtUtc), timezone = validZone(data.timezone);
  if (endAtUtc <= startAtUtc || endAtUtc.getTime() - startAtUtc.getTime() > 31 * 86400000) return invalid('Invalid exception interval');
  if (!['unavailable','schedule_adjustment','additional_hours'].includes(String(data.reasonCode))) return invalid('Structured reason code required');
  if (data.type === 'replacement' && (!data.replacesRuleId || localParts(startAtUtc, timezone).day !== localParts(new Date(endAtUtc.getTime()-1), timezone).day)) return invalid('Replacement requires a rule and one local day');
  if (data.type !== 'replacement' && data.replacesRuleId !== undefined) return invalid('Only replacements may reference a rule');
  if (data.type === 'block' && windowKeys.filter(k => k !== 'timezone').some(k => data[k] !== undefined)) return invalid('Blocks do not define session settings');
  const configuration = data.type === 'block' ? { timezone, sessionModes: ['online'], environments: [], slotDurationMinutes: 30, bufferBeforeMinutes: 0, bufferAfterMinutes: 0 } : windowConfiguration(data);
  if(data.type !== 'block' && endAtUtc.getTime()-startAtUtc.getTime() < (configuration.slotDurationMinutes+configuration.bufferBeforeMinutes+configuration.bufferAfterMinutes)*60000) return invalid('Exception interval is too short for its session and buffers');
  return { ...configuration, capabilityId: objectId(data.capabilityId), type: data.type as 'block'|'extra_availability'|'replacement', startAtUtc, endAtUtc,
    reasonCode: String(data.reasonCode), ...(data.replacesRuleId ? { replacesRuleId: objectId(data.replacesRuleId) } : {}) };
}
export interface BookingInput { professionalId: string; capabilityId: string; appointmentType: AppointmentType; relationshipId?: string; mode: string; environment?: string; startAtUtc: Date; endAtUtc: Date; timezone: string }
export function bookingInput(value: unknown): BookingInput {
  const d = object(value, ['professionalId','capabilityId','appointmentType','relationshipId','mode','environment','startAtUtc','endAtUtc','timezone']);
  if (!APPOINTMENT_TYPES.includes(d.appointmentType as AppointmentType)) return invalid('Invalid appointment type');
  if (d.appointmentType === 'follow_up' ? !d.relationshipId : d.relationshipId !== undefined) return invalid('Relationship is required only for follow_up');
  if (!['online','in_person'].includes(String(d.mode))) return invalid('Invalid session mode');
  if (d.mode === 'in_person' ? !['home','gym','outdoor'].includes(String(d.environment)) : d.environment !== undefined) return invalid('Invalid session environment');
  const startAtUtc = instant(d.startAtUtc), endAtUtc = instant(d.endAtUtc), minutes = (endAtUtc.getTime() - startAtUtc.getTime()) / 60000;
  if (![30,45,60,90].includes(minutes) || startAtUtc.getUTCSeconds() || startAtUtc.getUTCMilliseconds()) return invalid('Invalid duration or non-minute-aligned start');
  return { professionalId: objectId(d.professionalId), capabilityId: objectId(d.capabilityId), appointmentType: d.appointmentType as AppointmentType,
    ...(d.relationshipId ? { relationshipId: objectId(d.relationshipId) } : {}), mode: String(d.mode), ...(d.environment ? { environment: String(d.environment) } : {}), startAtUtc, endAtUtc, timezone: validZone(d.timezone) };
}
export function commandKey(value: unknown): string { if (typeof value !== 'string' || !/^[A-Za-z0-9._-]{8,128}$/.test(value)) return invalid('Idempotency-Key of 8-128 safe characters required'); return value; }
export function versionHeader(value: unknown, id: string): number {
  if (value === undefined) return fail(428, 'PRECONDITION_REQUIRED', 'If-Match is required');
  const m = typeof value === 'string' && /^"([a-f0-9]{24}):([1-9]\d*)"$/.exec(value);
  if (!m || m[1] !== id || !Number.isSafeInteger(Number(m[2]))) return fail(412, 'VERSION_CONFLICT', 'Resource version does not match'); return Number(m[2]);
}
export function period(query: Record<string, unknown>) {
  const from = instant(query.from), to = instant(query.to);
  if (to <= from || to.getTime() - from.getTime() > 31 * 86400000) return invalid('Use an increasing interval of at most 31 days'); return { from, to };
}
