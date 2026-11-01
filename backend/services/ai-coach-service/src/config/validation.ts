import { fail } from './errors';
export const invalid = (message: string): never => fail(400, 'VALIDATION_ERROR', message);
export function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !fields.includes(k))) return invalid('Unsupported fields or invalid object');
  return value as Record<string, unknown>;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/.test(value)) return invalid('Invalid identifier');
  return value;
}
export function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) return invalid('Integer outside allowed bounds');
  return value;
}
export function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return invalid('Invalid text');
  return value.trim();
}
export function zone(value: unknown): string {
  const result = text(value, 64);
  try { new Intl.DateTimeFormat('en', { timeZone: result }); return result; } catch { return invalid('Invalid IANA timezone'); }
}
export function instant(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return invalid('Use an ISO instant with offset');
  const day = value.slice(0, 10), date = new Date(value), calendar = new Date(day + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) return invalid('Invalid calendar instant');
  return date;
}
export function idempotency(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._-]{8,128}$/.test(value)) return invalid('Idempotency-Key of 8-128 safe characters required');
  return value;
}
export function pagination(query: unknown) {
  const q = object(query, ['limit', 'before']);
  if (q.limit !== undefined && (typeof q.limit !== 'string' || !/^[1-9]\d?$/.test(q.limit))) return invalid('limit must be 1-50');
  const limit = q.limit === undefined ? 20 : integer(Number(q.limit), 1, 50);
  return { limit, ...(q.before === undefined ? {} : { before: identifier(q.before) }) };
}
