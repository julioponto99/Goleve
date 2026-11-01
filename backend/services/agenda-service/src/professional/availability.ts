import { RuleData, ExceptionData, WindowConfiguration } from './models';
import { dayRange, intersects, localInstant, localParts } from './time';
export interface AvailabilityWindow extends WindowConfiguration { sourceId: string; start: Date; end: Date }
export type RuleRow = RuleData & { _id: { toString(): string } };
export type ExceptionRow = ExceptionData & { _id: { toString(): string } };
const configuration = (r: WindowConfiguration): WindowConfiguration => ({ timezone:r.timezone,sessionModes:r.sessionModes,environments:r.environments,slotDurationMinutes:r.slotDurationMinutes,bufferBeforeMinutes:r.bufferBeforeMinutes,bufferAfterMinutes:r.bufferAfterMinutes });
export function availabilityWindows(rules: RuleRow[], exceptions: ExceptionRow[], from: Date, to: Date): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  for (const rule of rules) {
    for (const day of dayRange(from, to)) {
      if (!rule.active || day < rule.validFrom || day > rule.validUntil || new Date(day).getUTCDay() !== rule.weekday) continue;
      if (exceptions.some(e => e.active && e.type === 'replacement' && e.replacesRuleId === String(rule._id) && localParts(e.startAtUtc, rule.timezone).day === day)) continue;
      const start = localInstant(day, rule.localStartTime, rule.timezone, rule.dstDisambiguation), end = localInstant(day, rule.localEndTime, rule.timezone, rule.dstDisambiguation);
      if (intersects(start, end, from, to)) windows.push({ ...configuration(rule), sourceId: String(rule._id), start, end });
    }
  }
  for (const e of exceptions) if (e.active && e.type !== 'block' && intersects(e.startAtUtc,e.endAtUtc,from,to)) windows.push({ ...configuration(e), sourceId: String(e._id), start: e.startAtUtc, end: e.endAtUtc });
  return windows.sort((a,b) => a.start.getTime() - b.start.getTime() || a.sourceId.localeCompare(b.sourceId));
}
export function subtractIntervals(start: Date, end: Date, occupied: { start: Date; end: Date }[]) {
  let ranges = [{ start, end }];
  for (const busy of occupied) ranges = ranges.flatMap(range => {
    if (!intersects(range.start,range.end,busy.start,busy.end)) return [range];
    const items = []; if (range.start < busy.start) items.push({ start: range.start, end: busy.start }); if (range.end > busy.end) items.push({ start: busy.end, end: range.end }); return items;
  });
  return ranges;
}
