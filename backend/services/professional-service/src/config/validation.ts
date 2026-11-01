import { ApiError } from './errors';
import { countries } from './countries';
import { CapabilityKind, CAPABILITY_KINDS, QUALIFICATION_TYPES, SERVICE_MODES, SPECIALIZATIONS } from './catalog';
export type JsonObject = Record<string, unknown>;
export function invalid(message: string): never { throw new ApiError(400, 'VALIDATION_ERROR', message); }
export function object(value: unknown, allowed: readonly string[]): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('A JSON object is required');
  const data = value as JsonObject;
  if (Object.keys(data).some((key) => !allowed.includes(key))) invalid('Unexpected fields');
  return data;
}
function nonempty(data: JsonObject): void { if (!Object.keys(data).length) invalid('At least one supported field is required'); }
export function text(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') return invalid('A string is required');
  const result = value.trim();
  if (result.length < min || result.length > max || /[\u0000-\u001f\u007f<>]/.test(result)) invalid('Invalid plain text');
  return result;
}
export function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid('Invalid integer');
  return value;
}
export function enumeration(value: unknown, allowed: readonly string[]): string {
  if (typeof value !== 'string' || !allowed.includes(value)) invalid('Invalid option');
  return value;
}
export function objectId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) invalid('Invalid resource identifier');
  return value.toLowerCase();
}
export function localDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid('Use YYYY-MM-DD');
  const date = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid('Invalid calendar date');
  return value;
}
export function country(value: unknown): string {
  const result = text(value, 2, 2).toUpperCase();
  if (!countries.has(result)) invalid('Invalid country code');
  return result;
}
function email(value: unknown): string {
  const result = text(value, 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) invalid('Invalid contact email');
  return result;
}
export function clearable(value: unknown, validate: (v: unknown) => unknown): unknown { return value === null ? null : validate(value); }
export function mergeFields(current: JsonObject, patch: JsonObject): JsonObject {
  const data = { ...current };
  for (const [key, value] of Object.entries(patch)) { if (value === null) delete data[key]; else data[key] = value; }
  return data;
}
function list(value: unknown, min: number, max: number, validate: (v: unknown) => unknown): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) invalid('Invalid list length');
  const result = value.map(validate);
  if (new Set(result.map((v) => JSON.stringify(v))).size !== result.length) invalid('Duplicate list entries');
  return result;
}
export const PROFILE_FIELDS = ['professionalName', 'biography', 'privateContactEmail', 'publicContacts', 'countryCode', 'languages'] as const;
export function validateProfile(body: unknown, partial = false): JsonObject {
  const input = object(body, PROFILE_FIELDS); nonempty(input); const out: JsonObject = {};
  if ('professionalName' in input) out.professionalName = text(input.professionalName, 2, 150);
  else if (!partial) invalid('professionalName is required');
  if ('countryCode' in input) out.countryCode = country(input.countryCode);
  else if (!partial) invalid('countryCode is required');
  if ('languages' in input) out.languages = list(input.languages, 1, 10, (v) => {
    try { const code = Intl.getCanonicalLocales(text(v, 2, 35))[0];
      if (!Intl.DateTimeFormat.supportedLocalesOf([code]).length) invalid('Unsupported language'); return code;
    } catch { return invalid('Invalid language'); }
  }); else if (!partial) invalid('languages is required');
  if ('biography' in input) out.biography = clearable(input.biography, (v) => text(v, 1, 2000));
  if ('privateContactEmail' in input) out.privateContactEmail = clearable(input.privateContactEmail, email);
  if ('publicContacts' in input) out.publicContacts = clearable(input.publicContacts, (v) => {
    const contacts = object(v, ['email', 'phoneE164']); nonempty(contacts); const result: JsonObject = {};
    if ('email' in contacts) result.email = email(contacts.email);
    if ('phoneE164' in contacts) { const phone = text(contacts.phoneE164, 8, 16);
      if (!/^\+[1-9]\d{6,14}$/.test(phone)) invalid('Use an E.164 phone number'); result.phoneE164 = phone; }
    return result;
  });
  return out;
}
export const CAPABILITY_FIELDS = ['kind', 'jurisdictionCountry', 'specializations', 'experienceStartYear', 'serviceModes'] as const;
export const CAPABILITY_MUTABLE_FIELDS = ['specializations', 'experienceStartYear', 'serviceModes'] as const;
export function validateCapability(body: unknown, partial = false): JsonObject {
  const input = object(body, partial ? CAPABILITY_MUTABLE_FIELDS : CAPABILITY_FIELDS); nonempty(input); const out: JsonObject = {};
  if (!partial) { out.kind = enumeration(input.kind, CAPABILITY_KINDS); out.jurisdictionCountry = country(input.jurisdictionCountry); }
  if ('serviceModes' in input) out.serviceModes = list(input.serviceModes, 1, 3, (v) => enumeration(v, SERVICE_MODES));
  else if (!partial) invalid('serviceModes is required');
  if ('experienceStartYear' in input) out.experienceStartYear = clearable(input.experienceStartYear, (v) => integer(v, 1, new Date().getUTCFullYear()));
  if ('specializations' in input) out.specializations = list(input.specializations, 0, 20, (v) => text(v, 1, 80));
  return out;
}
export function validateCapabilityConsistency(data: JsonObject): void {
  const allowed = SPECIALIZATIONS[data.kind as CapabilityKind];
  if (!allowed || (data.specializations as string[] || []).some((v) => !allowed.includes(v))) invalid('Specialization is not in this synthetic capability catalog');
}
export const QUALIFICATION_FIELDS = ['capabilityId', 'qualificationType', 'title', 'issuerName', 'awardedOn', 'expiresOn', 'specializationCodes'] as const;
export const QUALIFICATION_MUTABLE_FIELDS = QUALIFICATION_FIELDS.filter((field) => field !== 'capabilityId');
export function validateQualification(body: unknown, partial = false): JsonObject {
  const input = object(body, partial ? QUALIFICATION_MUTABLE_FIELDS : QUALIFICATION_FIELDS); nonempty(input); const out: JsonObject = {};
  if ('capabilityId' in input) out.capabilityId = objectId(input.capabilityId);
  if ('qualificationType' in input) out.qualificationType = enumeration(input.qualificationType, QUALIFICATION_TYPES);
  else if (!partial) invalid('qualificationType is required');
  for (const key of ['title', 'issuerName']) {
    if (key in input) out[key] = text(input[key], 2, 200); else if (!partial) invalid(key + ' is required');
  }
  if ('awardedOn' in input) out.awardedOn = clearable(input.awardedOn, (v) => {
    const date = localDate(v); if (date > new Date().toISOString().slice(0, 10)) invalid('Award date is in the future'); return date;
  });
  if ('expiresOn' in input) out.expiresOn = clearable(input.expiresOn, localDate);
  if ('specializationCodes' in input) out.specializationCodes = list(input.specializationCodes, 0, 10, (v) => text(v, 1, 80));
  return out;
}
export function validateQualificationConsistency(data: JsonObject, kind?: CapabilityKind): void {
  if (data.awardedOn && data.expiresOn && String(data.expiresOn) < String(data.awardedOn)) invalid('Expiry precedes award date');
  const codes = data.specializationCodes as string[] || [];
  if (codes.length && !kind) invalid('Specializations require a capability reference');
  if (kind && codes.some((v) => !SPECIALIZATIONS[kind].includes(v))) invalid('Specialization is not in this synthetic capability catalog');
}
export const AVAILABILITY_FIELDS = ['timeZone', 'preferredWeekdays', 'windows', 'serviceModes'] as const;
export function validateAvailability(body: unknown, partial = false): JsonObject {
  const input = object(body, AVAILABILITY_FIELDS); nonempty(input); const out: JsonObject = {};
  if ('timeZone' in input) {
    const zone = text(input.timeZone, 1, 100);
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); } catch { invalid('Invalid IANA time zone'); }
    out.timeZone = zone;
  } else if (!partial) invalid('timeZone is required');
  if ('preferredWeekdays' in input) out.preferredWeekdays = list(input.preferredWeekdays, 1, 7, (v) => integer(v, 0, 6));
  else if (!partial) invalid('preferredWeekdays is required');
  if ('serviceModes' in input) out.serviceModes = list(input.serviceModes, 1, 2, (v) => enumeration(v, ['online', 'in_person']));
  else if (!partial) invalid('serviceModes is required');
  if ('windows' in input) out.windows = list(input.windows, 1, 14, (v) => {
    const w = object(v, ['weekday', 'startMinute', 'endMinute']);
    const startMinute = integer(w.startMinute, 0, 1439), endMinute = integer(w.endMinute, 0, 1439);
    if (endMinute <= startMinute) invalid('Time windows must end after their start within one day');
    return { weekday: integer(w.weekday, 0, 6), startMinute, endMinute };
  }); else if (!partial) invalid('windows is required');
  return out;
}
export function validateAvailabilityConsistency(data: JsonObject): void {
  const days = data.preferredWeekdays as number[], windows = data.windows as { weekday: number; startMinute: number; endMinute: number }[];
  if (windows.some((w) => !days.includes(w.weekday)) || days.some((day) => !windows.some((w) => w.weekday === day))) invalid('Weekdays and windows must match');
  const ordered = [...windows].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  if (ordered.some((w, i) => i > 0 && ordered[i - 1].weekday === w.weekday && w.startMinute < ordered[i - 1].endMinute)) invalid('Preferred windows overlap');
}
