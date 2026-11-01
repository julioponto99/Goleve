import { Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { PerformanceModels } from '../models';
import { MeasurementKind } from '../models/measurement.model';
import { PerformanceGoalKind } from '../models/goal.model';

const timezoneOf = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 64) throw new ApiError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA timezone');
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return value; } catch { throw new ApiError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA timezone'); }
};
const number = (value: unknown, field: string, min: number, max: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be between ${min} and ${max}`);
  return value;
};
const integer = (value: unknown, field: string, min: number, max: number) => {
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be an integer`);
  return number(value, field, min, max);
};
const text = (value: unknown, field: string, max: number) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} is invalid`);
  return value.trim();
};
const identifier = (value: string) => {
  if (!/^[a-f0-9]{24}$/.test(value)) throw new ApiError(400, 'INVALID_ID', 'Invalid identifier');
  return value;
};
const instant = (value: unknown, field: string, fallback?: Date) => {
  if (value === undefined && fallback) return fallback;
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be a valid ISO instant`);
  return new Date(value);
};
const localDate = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const dateRange = (from: unknown, to: unknown) => {
  const start = from === undefined ? undefined : instant(from, 'from');
  const end = to === undefined ? undefined : instant(to, 'to');
  if (start && end && start > end) throw new ApiError(400, 'INVALID_RANGE', 'from must be before to');
  return { ...(start ? { $gte: start } : {}), ...(end ? { $lte: end } : {}) };
};
const dto = (doc: { _id: Types.ObjectId; toObject(): Record<string, unknown> }) => ({ id: doc._id.toHexString(), ...doc.toObject(), _id: undefined });
const filterDates = (filter: Record<string, unknown>, field: string, from: unknown, to: unknown) => {
  if (from !== undefined || to !== undefined) filter[field] = dateRange(from, to);
};
export interface ListOptions { page: number; pageSize: number; from?: string; to?: string }

export class PerformanceService {
  constructor(private readonly models: PerformanceModels, private readonly now = () => new Date()) {}

  async createMeasurement(ctx: RequestContext, body: Record<string, unknown>) {
    const kind = text(body.kind, 'kind', 20) as MeasurementKind;
    if (!['weight', 'height', 'waist', 'hip', 'chest', 'arm', 'thigh', 'other'].includes(kind)) throw new ApiError(400, 'INVALID_KIND', 'Unsupported measurement kind');
    const unit = kind === 'weight' ? 'kg' : 'cm';
    if (body.unit !== undefined && body.unit !== unit) throw new ApiError(400, 'INVALID_UNIT', `Unit for ${kind} must be ${unit}`);
    const measuredAt = instant(body.measuredAt, 'measuredAt', this.now());
    const timezone = timezoneOf(body.timezone);
    const idempotencyKey = body.idempotencyKey === undefined ? undefined : text(body.idempotencyKey, 'idempotencyKey', 128);
    if (idempotencyKey) {
      const existing = await this.models.Measurement.findOne({ ownerId: ctx.identity.id, idempotencyKey });
      if (existing) return { item: dto(existing), created: false };
    }
    try {
      const item = await this.models.Measurement.create({ ownerId: ctx.identity.id, kind, value: number(body.value, 'value', 0.01, 1000), unit, measuredAt, timezone, source: 'manual', idempotencyKey });
      return { item: dto(item), created: true };
    } catch (error) {
      if ((error as { code?: number }).code === 11000 && idempotencyKey) {
        const duplicate = await this.models.Measurement.findOne({ ownerId: ctx.identity.id, idempotencyKey });
        if (duplicate) return { item: dto(duplicate), created: false };
      }
      throw error;
    }
  }
  async listMeasurements(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'measuredAt', options.from, options.to);
    const [items, total] = await Promise.all([this.models.Measurement.find(filter).sort({ measuredAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.Measurement.countDocuments(filter)]);
    return { items: items.map(dto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async updateMeasurement(ctx: RequestContext, measurementId: string, body: Record<string, unknown>) {
    const current = await this.models.Measurement.findOne({ _id: identifier(measurementId), ownerId: ctx.identity.id });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Measurement not found');
    const value = body.value === undefined ? current.value : number(body.value, 'value', 0.01, 1000);
    const measuredAt = body.measuredAt === undefined ? current.measuredAt : instant(body.measuredAt, 'measuredAt');
    const timezone = body.timezone === undefined ? current.timezone : timezoneOf(body.timezone);
    const updated = await this.models.Measurement.findOneAndUpdate({ _id: current._id, ownerId: ctx.identity.id, updatedAt: current.updatedAt }, { $set: { value, measuredAt, timezone } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Measurement changed concurrently; read it again');
    return dto(updated);
  }
  async deleteMeasurement(ctx: RequestContext, measurementId: string) {
    const deleted = await this.models.Measurement.findOneAndDelete({ _id: identifier(measurementId), ownerId: ctx.identity.id });
    if (!deleted) throw new ApiError(404, 'NOT_FOUND', 'Measurement not found');
    return { id: deleted._id.toHexString(), deleted: true };
  }
  async measurementEvolution(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'measuredAt', options.from, options.to);
    const items = await this.models.Measurement.find(filter).sort({ measuredAt: 1, _id: 1 });
    const byKind = new Map<string, typeof items>();
    for (const item of items) byKind.set(item.kind, [...(byKind.get(item.kind) ?? []), item]);
    return { items: [...byKind.entries()].map(([kind, values]) => ({ kind, first: dto(values[0]), latest: dto(values[values.length - 1]), change: values[values.length - 1].value - values[0].value, records: values.length })) };
  }

  async createSteps(ctx: RequestContext, body: Record<string, unknown>) {
    const timezone = timezoneOf(body.timezone);
    const recordedAt = instant(body.recordedAt, 'recordedAt', this.now());
    const idempotencyKey = body.idempotencyKey === undefined ? undefined : text(body.idempotencyKey, 'idempotencyKey', 128);
    if (idempotencyKey) { const existing = await this.models.Steps.findOne({ ownerId: ctx.identity.id, idempotencyKey }); if (existing) return { item: dto(existing), created: false }; }
    const payload = { ownerId: ctx.identity.id, count: integer(body.count, 'count', 0, 200000), recordedAt, timezone, localDate: localDate(recordedAt, timezone), source: 'manual' as const, idempotencyKey };
    try { return { item: dto(await this.models.Steps.create(payload)), created: true }; }
    catch (error) {
      if ((error as { code?: number }).code === 11000 && idempotencyKey) { const duplicate = await this.models.Steps.findOne({ ownerId: ctx.identity.id, idempotencyKey }); if (duplicate) return { item: dto(duplicate), created: false }; }
      throw error;
    }
  }
  async listSteps(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'recordedAt', options.from, options.to);
    const [items, total] = await Promise.all([this.models.Steps.find(filter).sort({ recordedAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.Steps.countDocuments(filter)]);
    return { items: items.map(dto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async dailySteps(ctx: RequestContext, date: string, timezone: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'INVALID_DATE', 'date must use YYYY-MM-DD');
    timezoneOf(timezone);
    const items = await this.models.Steps.find({ ownerId: ctx.identity.id, localDate: date, timezone }).sort({ recordedAt: 1, _id: 1 });
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const goal = await this.models.Goal.findOne({ ownerId: ctx.identity.id, kind: 'steps' });
    return { date, timezone, items: items.map(dto), total, target: goal?.target ?? null, percentage: goal ? Number((total / goal.target * 100).toFixed(2)) : null };
  }
  async stepsSummary(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'recordedAt', options.from, options.to);
    const items = await this.models.Steps.find(filter).sort({ recordedAt: 1, _id: 1 });
    const byDay = new Map<string, number>();
    for (const item of items) byDay.set(item.localDate, (byDay.get(item.localDate) ?? 0) + item.count);
    const values = [...byDay.entries()].map(([date, total]) => ({ date, total }));
    return { total: values.reduce((sum, item) => sum + item.total, 0), days: values.length, averageDaily: values.length ? Number((values.reduce((sum, item) => sum + item.total, 0) / values.length).toFixed(2)) : 0, items: values };
  }

  async createHeartRate(ctx: RequestContext, body: Record<string, unknown>) {
    const timezone = timezoneOf(body.timezone), measuredAt = instant(body.measuredAt, 'measuredAt', this.now());
    const idempotencyKey = body.idempotencyKey === undefined ? undefined : text(body.idempotencyKey, 'idempotencyKey', 128);
    if (idempotencyKey) { const existing = await this.models.HeartRate.findOne({ ownerId: ctx.identity.id, idempotencyKey }); if (existing) return { item: dto(existing), created: false }; }
    const context = body.context === undefined ? undefined : text(body.context, 'context', 100);
    try { return { item: dto(await this.models.HeartRate.create({ ownerId: ctx.identity.id, bpm: integer(body.bpm, 'bpm', 20, 250), measuredAt, timezone, context, source: 'manual', idempotencyKey })), created: true }; }
    catch (error) {
      if ((error as { code?: number }).code === 11000 && idempotencyKey) { const duplicate = await this.models.HeartRate.findOne({ ownerId: ctx.identity.id, idempotencyKey }); if (duplicate) return { item: dto(duplicate), created: false }; }
      throw error;
    }
  }
  async heartRateHistory(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'measuredAt', options.from, options.to);
    const [items, total] = await Promise.all([this.models.HeartRate.find(filter).sort({ measuredAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.HeartRate.countDocuments(filter)]);
    return { items: items.map(dto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async heartRateSummary(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filterDates(filter, 'measuredAt', options.from, options.to);
    const items = await this.models.HeartRate.find(filter).sort({ measuredAt: 1, _id: 1 });
    const values = items.map((item) => item.bpm), average = values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
    return { count: values.length, average, minimum: values.length ? Math.min(...values) : null, maximum: values.length ? Math.max(...values) : null, trend: values.length > 1 ? values[values.length - 1] - values[0] : 0 };
  }

  async listGoals(ctx: RequestContext) { return { items: (await this.models.Goal.find({ ownerId: ctx.identity.id }).sort({ kind: 1 })).map(dto) }; }
  async setGoal(ctx: RequestContext, kindValue: string, body: Record<string, unknown>) {
    const kind = text(kindValue, 'kind', 20) as PerformanceGoalKind;
    if (!['weight', 'steps', 'waist', 'heart_rate'].includes(kind)) throw new ApiError(400, 'INVALID_KIND', 'Unsupported goal kind');
    const unit = kind === 'weight' ? 'kg' : kind === 'steps' ? 'steps' : kind === 'waist' ? 'cm' : 'bpm';
    const target = number(body.target, 'target', kind === 'steps' ? 1 : 0.01, kind === 'steps' ? 200000 : kind === 'heart_rate' ? 250 : 1000);
    if (kind === 'steps' && !Number.isInteger(target)) throw new ApiError(400, 'INVALID_TARGET', 'Steps target must be an integer');
    const timezone = timezoneOf(body.timezone);
    const current = await this.models.Goal.findOne({ ownerId: ctx.identity.id, kind });
    if (!current) return dto(await this.models.Goal.create({ ownerId: ctx.identity.id, kind, target, unit, timezone, version: 1 }));
    const version = body.version === undefined ? current.version : integer(body.version, 'version', 1, Number.MAX_SAFE_INTEGER);
    if (version !== current.version) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Goal changed concurrently; read it again');
    const updated = await this.models.Goal.findOneAndUpdate({ ownerId: ctx.identity.id, kind, version }, { $set: { target, timezone, version: version + 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Goal changed concurrently; read it again');
    return dto(updated);
  }
  async overview(ctx: RequestContext) {
    const [measurements, steps, heartRate] = await Promise.all([this.models.Measurement.find({ ownerId: ctx.identity.id }).sort({ measuredAt: -1 }).limit(20), this.stepsSummary(ctx, { page: 1, pageSize: 20 }), this.heartRateSummary(ctx, { page: 1, pageSize: 20 })]);
    return { latestMeasurements: measurements.map(dto), steps, heartRate };
  }
}
