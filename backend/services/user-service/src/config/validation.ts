import { ApiError } from './errors';
import { MEASUREMENT_KINDS } from '../models/body-measurement.model';
import { GOAL_STATUSES, GOAL_TYPES } from '../models/user-goal.model';

export type JsonObject = Record<string, unknown>;
export function invalid(message: string): never {
  throw new ApiError(400, 'VALIDATION_ERROR', message);
}
export function object(value: unknown, allowed: readonly string[]): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid('A JSON object is required');
  const result = value as JsonObject;
  if (Object.keys(result).some((key) => !allowed.includes(key))) return invalid('Unexpected fields');
  return result;
}
export function text(value: unknown, minimum: number, maximum: number): string {
  if (typeof value !== 'string') return invalid('A string is required');
  const result = value.trim();
  if (result.length < minimum || result.length > maximum || /[\u0000-\u001f\u007f]/.test(result)) return invalid('Invalid string length or characters');
  return result;
}
export function enumeration(value: unknown, values: readonly string[]): string {
  if (typeof value !== 'string' || !values.includes(value)) return invalid('Invalid option');
  return value;
}
export function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) return invalid('Invalid integer');
  return value;
}
export function objectId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) return invalid('Invalid resource identifier');
  return value.toLowerCase();
}
export function localDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalid('Use YYYY-MM-DD');
  const date = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return invalid('Invalid calendar date');
  return value;
}
export function instant(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return invalid('Use an ISO 8601 UTC timestamp');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) return invalid('Invalid timestamp');
  return date;
}
export function timeZone(value: unknown): string {
  const result = text(value, 1, 100);
  try { new Intl.DateTimeFormat('en', { timeZone: result }); } catch { return invalid('Invalid IANA time zone'); }
  return result;
}
function nonempty(data: JsonObject): void {
  if (!Object.keys(data).length) invalid('At least one supported field is required');
}
function clearable(value: unknown, validator: (v: unknown) => unknown): unknown {
  return value === null ? null : validator(value);
}
export function mergeFields(current: JsonObject, patch: JsonObject): JsonObject {
  const result = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete result[key];
    else result[key] = value;
  }
  return result;
}

export const PROFILE_FIELDS = ['displayName', 'birthDate', 'gender', 'genderDescription', 'contactEmail', 'phoneE164', 'countryCode', 'approximateLocation'] as const;
const countries = new Set(('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW').split(' '));
export function validateProfile(body: unknown, partial = false): JsonObject {
  const data = object(body, PROFILE_FIELDS); nonempty(data);
  const out: JsonObject = {};
  if ('displayName' in data) out.displayName = text(data.displayName, 2, 100);
  else if (!partial) invalid('displayName is required');
  if ('birthDate' in data) out.birthDate = clearable(data.birthDate, (v) => {
    const date = localDate(v);
    if (date > new Date().toISOString().slice(0, 10)) invalid('Birth date cannot be in the future');
    return date;
  });
  if ('gender' in data) out.gender = clearable(data.gender, (v) => enumeration(v, ['mulher', 'homem', 'nao_binario', 'autodescrito', 'prefiro_nao_indicar']));
  if ('genderDescription' in data) out.genderDescription = clearable(data.genderDescription, (v) => text(v, 1, 80));
  if ('contactEmail' in data) out.contactEmail = clearable(data.contactEmail, (v) => {
    const email = text(v, 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid('Invalid contact email');
    return email;
  });
  if ('phoneE164' in data) out.phoneE164 = clearable(data.phoneE164, (v) => {
    const phone = text(v, 8, 16);
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) invalid('Use an E.164 phone number');
    return phone;
  });
  if ('countryCode' in data) out.countryCode = clearable(data.countryCode, (v) => {
    const country = text(v, 2, 2).toUpperCase();
    if (!countries.has(country)) invalid('Invalid country code');
    return country;
  });
  if ('approximateLocation' in data) out.approximateLocation = clearable(data.approximateLocation, (v) => {
    const location = object(v, ['regionCode', 'cityLabel']); nonempty(location);
    const normalized: JsonObject = {};
    if ('regionCode' in location) normalized.regionCode = text(location.regionCode, 1, 20);
    if ('cityLabel' in location) normalized.cityLabel = text(location.cityLabel, 1, 100);
    return normalized;
  });
  return out;
}
export function validateProfileConsistency(data: JsonObject): void {
  if (data.gender === 'autodescrito' && !data.genderDescription) invalid('genderDescription is required for autodescrito');
  if (data.gender !== 'autodescrito' && data.genderDescription) invalid('genderDescription requires autodescrito');
}

export const PREFERENCE_FIELDS = ['locale', 'timeZone', 'theme', 'units', 'notifications', 'quietHours'] as const;
function booleanObject(value: unknown, fields: string[]): JsonObject {
  const data = object(value, fields); nonempty(data);
  if (Object.values(data).some((v) => typeof v !== 'boolean')) invalid('Notification values must be boolean');
  return data;
}
export function validatePreferences(body: unknown, partial = false): JsonObject {
  const data = object(body, PREFERENCE_FIELDS); nonempty(data);
  const out: JsonObject = {};
  if ('locale' in data) {
    const locale = text(data.locale, 2, 35);
    try {
      const canonical = Intl.getCanonicalLocales(locale)[0];
      if (!Intl.DateTimeFormat.supportedLocalesOf([canonical]).length) invalid('Unsupported locale');
      out.locale = canonical;
    } catch { invalid('Unsupported locale'); }
  }
  if ('timeZone' in data) out.timeZone = timeZone(data.timeZone);
  else if (!partial) invalid('timeZone must be explicitly selected');
  if ('theme' in data) out.theme = enumeration(data.theme, ['system', 'light', 'dark']);
  if ('units' in data) {
    const units = object(data.units, ['system']);
    out.units = { system: enumeration(units.system, ['metric', 'imperial']) };
  }
  if ('notifications' in data) {
    const n = object(data.notifications, ['channels', 'categories']); nonempty(n);
    const result: JsonObject = {};
    if ('channels' in n) result.channels = booleanObject(n.channels, ['inApp', 'email', 'push']);
    if ('categories' in n) result.categories = booleanObject(n.categories, ['appointments', 'activity', 'hydration', 'security']);
    out.notifications = result;
  }
  if ('quietHours' in data) out.quietHours = clearable(data.quietHours, (v) => {
    const q = object(v, ['startMinute', 'endMinute', 'days']);
    const startMinute = integer(q.startMinute, 0, 1439), endMinute = integer(q.endMinute, 0, 1439);
    if (startMinute === endMinute) invalid('Quiet hours must have distinct boundaries');
    return { startMinute, endMinute, days: days(q.days) };
  });
  return out;
}
function days(value: unknown): number[] {
  if (!Array.isArray(value) || !value.length || value.length > 7) return invalid('Select between one and seven days');
  const result = value.map((v) => integer(v, 0, 6));
  if (new Set(result).size !== result.length) invalid('Duplicate days are not allowed');
  return result;
}
export function mergePreferences(current: JsonObject, patch: JsonObject): JsonObject {
  const result = mergeFields(current, patch);
  if (patch.notifications) {
    const old = current.notifications as JsonObject, next = patch.notifications as JsonObject;
    result.notifications = {
      channels: { ...(old.channels as JsonObject), ...(next.channels as JsonObject || {}) },
      categories: { ...(old.categories as JsonObject), ...(next.categories as JsonObject || {}) },
    };
  }
  return result;
}
export function preferenceDefaults(): JsonObject {
  return { locale: 'pt-PT', theme: 'system', units: { system: 'metric' },
    notifications: { channels: { inApp: true, email: false, push: false },
      categories: { appointments: false, activity: false, hydration: false, security: true } } };
}

export function validateHabits(body: unknown): JsonObject {
  const data = object(body, ['usualSleepMinutes', 'exerciseDaysPerWeek', 'activityLevel', 'preferredTrainingWindows', 'hydrationHabit']);
  nonempty(data); const out: JsonObject = {};
  if ('usualSleepMinutes' in data) out.usualSleepMinutes = clearable(data.usualSleepMinutes, (v) => integer(v, 0, 1440));
  if ('exerciseDaysPerWeek' in data) out.exerciseDaysPerWeek = clearable(data.exerciseDaysPerWeek, (v) => integer(v, 0, 7));
  if ('activityLevel' in data) out.activityLevel = clearable(data.activityLevel, (v) => enumeration(v, ['sedentary', 'light', 'moderate', 'high', 'very_high', 'unknown']));
  if ('hydrationHabit' in data) out.hydrationHabit = clearable(data.hydrationHabit, (v) => enumeration(v, ['rarely_tracked', 'irregular', 'regular', 'unknown']));
  if ('preferredTrainingWindows' in data) {
    if (!Array.isArray(data.preferredTrainingWindows) || data.preferredTrainingWindows.length > 14) invalid('At most fourteen training windows are allowed');
    out.preferredTrainingWindows = data.preferredTrainingWindows.map((value) => {
      const w = object(value, ['day', 'startMinute', 'endMinute', 'timeZone']);
      const startMinute = integer(w.startMinute, 0, 1439), endMinute = integer(w.endMinute, 0, 1439);
      if (endMinute <= startMinute) invalid('Training windows must end after their start within one day');
      return { day: integer(w.day, 0, 6), startMinute, endMinute, timeZone: timeZone(w.timeZone) };
    });
  }
  return out;
}
export interface MeasurementInput { kind: string; value: number; unit: string; measuredAt: Date }
export function validateMeasurement(body: unknown): MeasurementInput {
  const data = object(body, ['kind', 'value', 'unit', 'measuredAt']);
  const kind = enumeration(data.kind, MEASUREMENT_KINDS);
  const unit = kind === 'weight' ? 'g' : 'mm';
  if (data.unit !== unit) invalid('Measurement unit does not match its kind');
  const value = integer(data.value, 1, kind === 'weight' ? 1000000 : kind === 'height' ? 3000 : 5000);
  const measuredAt = instant(data.measuredAt);
  if (measuredAt.getTime() > Date.now() + 5 * 60 * 1000) invalid('Measurement timestamp is in the future');
  return { kind, value, unit, measuredAt };
}

export function validateGoal(body: unknown, partial = false): JsonObject {
  const data = object(body, ['goalType', 'title', 'description', 'target', 'baselineMeasurementId', 'startsOn', 'targetDate', 'status']);
  nonempty(data); const out: JsonObject = {};
  if ('goalType' in data) out.goalType = enumeration(data.goalType, GOAL_TYPES);
  else if (!partial) invalid('goalType is required');
  if ('title' in data) out.title = text(data.title, 2, 120);
  else if (!partial) invalid('title is required');
  if ('description' in data) out.description = clearable(data.description, (v) => text(v, 1, 1000));
  if ('status' in data) out.status = enumeration(data.status, GOAL_STATUSES);
  else if (!partial) out.status = 'proposed';
  for (const key of ['startsOn', 'targetDate']) if (key in data) out[key] = clearable(data[key], localDate);
  if ('baselineMeasurementId' in data) out.baselineMeasurementId = clearable(data.baselineMeasurementId, objectId);
  if ('target' in data) out.target = clearable(data.target, (v) => {
    const target = object(v, ['metric', 'value', 'tolerance', 'unit', 'period']);
    const metric = enumeration(target.metric, ['body_weight', 'water_volume', 'steps', 'active_minutes', 'training_frequency']);
    const units: Record<string, string> = { body_weight: 'g', water_volume: 'ml', steps: 'steps', active_minutes: 'minutes', training_frequency: 'sessions_per_week' };
    if (target.unit !== units[metric]) invalid('Goal unit does not match its metric');
    if (typeof target.value !== 'number' || !Number.isFinite(target.value) || target.value <= 0) invalid('Goal target must be finite and positive');
    const period = enumeration(target.period, ['once', 'day', 'week']);
    const result: JsonObject = { metric, value: target.value, unit: target.unit, period };
    if ('tolerance' in target) {
      if (typeof target.tolerance !== 'number' || !Number.isFinite(target.tolerance) || target.tolerance < 0) invalid('Invalid tolerance');
      result.tolerance = target.tolerance;
    }
    return result;
  });
  return out;
}
export function validateGoalConsistency(data: JsonObject): void {
  if (data.startsOn && data.targetDate && String(data.targetDate) < String(data.startsOn)) invalid('targetDate precedes startsOn');
  const target = data.target as JsonObject | undefined;
  if (!target) {
    if (data.baselineMeasurementId) invalid('A baseline requires a quantitative target');
    return;
  }
  const allowed: Record<string, string[]> = {
    weight_loss: ['body_weight'], weight_maintenance: ['body_weight'], muscle_gain: [],
    fitness: ['active_minutes', 'training_frequency'], hydration: ['water_volume'],
    daily_activity: ['steps', 'active_minutes'], custom: [],
  };
  if (!allowed[String(data.goalType)]?.includes(String(target.metric))) invalid('Target metric is not supported for this goal type');
  if (target.metric === 'body_weight' && target.period !== 'once') invalid('Weight targets use period once');
  if (target.metric === 'training_frequency' && target.period !== 'week') invalid('Training frequency uses period week');
  if (['water_volume', 'steps'].includes(String(target.metric)) && target.period !== 'day') invalid('This target uses period day');
}
