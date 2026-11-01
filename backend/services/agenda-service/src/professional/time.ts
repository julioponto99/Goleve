import { ApiError } from '../config/errors';
const invalid = (message: string): never => { throw new ApiError(400, 'VALIDATION_ERROR', message); };
const formatters = new Map<string, Intl.DateTimeFormat>();
export function validZone(value: unknown): string {
  if (typeof value !== 'string' || value.length > 64 || !value || /^[+-]/.test(value)) return invalid('An IANA timezone is required');
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return value; } catch { return invalid('An IANA timezone is required'); }
}
export function instant(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return invalid('Use an ISO instant with an explicit offset');
  const d = new Date(value), day = value.slice(0, 10);
  if (!Number.isFinite(d.getTime()) || !validDate(day)) return invalid('Invalid calendar instant');
  const h = Number(value.slice(11, 13)), m = Number(value.slice(14, 16)), s = Number(value.slice(17, 19));
  if (h > 23 || m > 59 || s > 59) return invalid('Invalid calendar instant');
  return d;
}
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
export function localParts(date: Date, zone: string) {
  let f = formatters.get(zone);
  if (!f) { if (formatters.size > 100) formatters.clear(); f = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); formatters.set(zone, f); }
  const p = Object.fromEntries(f.formatToParts(date).map(v => [v.type, v.value]));
  return { day: p.year + '-' + p.month + '-' + p.day, time: p.hour + ':' + p.minute, second: Number(p.second) };
}
export function localInstant(day: string, time: string, zone: string, disambiguation?: 'earlier' | 'later'): Date {
  if (!validDate(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return invalid('Invalid local date or time');
  const nominal = Date.parse(day + 'T' + time + ':00Z'), offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 3) {
    const candidate = new Date(nominal + hours * 3600000), p = localParts(candidate, zone);
    offsets.add(Date.parse(p.day + 'T' + p.time + ':00Z') - candidate.getTime());
  }
  const candidates = [...offsets].map(offset => new Date(nominal - offset)).filter(d => { const p = localParts(d, zone); return p.day === day && p.time === time && p.second === 0; }).sort((a,b) => a.getTime() - b.getTime());
  if (!candidates.length) return invalid('Nonexistent local time in this timezone');
  if (candidates.length > 1 && !disambiguation) return invalid('Ambiguous local time requires earlier or later');
  return disambiguation === 'later' ? candidates[candidates.length - 1] : candidates[0];
}
export function dayRange(from: Date, to: Date): string[] {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()) - 86400000;
  const result: string[] = [];
  for (let t = start; t <= to.getTime() + 86400000; t += 86400000) result.push(new Date(t).toISOString().slice(0,10));
  return result;
}
export const intersects = (a: Date, b: Date, c: Date, d: Date) => a < d && c < b;
