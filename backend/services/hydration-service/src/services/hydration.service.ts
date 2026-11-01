import { Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { HydrationModels } from '../models';
import { GoalSource } from '../models/goal.model';
import { ReminderFrequency } from '../models/reminder.model';
import { newOutboxEvent, outboxEnabled, withOutboxTransaction } from '../events/outbox';

const timezoneOf = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 64) throw new ApiError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA timezone');
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return value; }
  catch { throw new ApiError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA timezone'); }
};
const integer = (value: unknown, field: string, min: number, max: number) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be an integer between ${min} and ${max}`);
  return value;
};
const text = (value: unknown, field: string, max: number) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} is invalid`);
  return value.trim();
};
const id = (value: string, field: string) => {
  if (!/^[a-f0-9]{24}$/.test(value)) throw new ApiError(400, 'INVALID_ID', `${field} must be a valid identifier`);
  return value;
};
function localDate(value: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const result = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${result.year}-${result.month}-${result.day}`;
}
function instant(value: unknown, field: string): Date {
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be a valid ISO instant`);
  return new Date(value);
}
function dto(doc: { _id: Types.ObjectId; toObject(): Record<string, unknown> }) {
  const value = doc.toObject();
  return { id: doc._id.toHexString(), ...value, _id: undefined };
}
export interface HydrationListOptions { page: number; pageSize: number; from?: string; to?: string; timezone?: string }
export interface GoalSuggestion { targetMl: number; liters: number; cups: number; assumptions: { gender: 'homem' | 'mulher'; weightKg: number; ageYears: number; active: boolean; ageReductionApplied: boolean } }
export function calculateSuggestedGoal(input: { gender: 'homem' | 'mulher'; weightKg: number; ageYears: number; active: boolean }): GoalSuggestion {
  const base = input.weightKg * (input.gender === 'homem' ? 35 : 30);
  const reduced = input.ageYears > 55 ? base * 0.95 : base;
  const targetMl = Math.round(reduced + (input.active ? 500 : 0));
  return { targetMl, liters: Number((targetMl / 1000).toFixed(2)), cups: Number((targetMl / 250).toFixed(2)), assumptions: { ...input, ageReductionApplied: input.ageYears > 55 } };
}
export class HydrationService {
  constructor(private readonly models: HydrationModels, private readonly now = () => new Date()) {}
  async suggest(input: Record<string, unknown>) {
    if (input.gender !== 'homem' && input.gender !== 'mulher') throw new ApiError(400, 'INVALID_GENDER', 'gender must be homem or mulher');
    return calculateSuggestedGoal({ gender: input.gender, weightKg: integer(input.weightKg, 'weightKg', 1, 500), ageYears: integer(input.ageYears, 'ageYears', 1, 130), active: input.active === true });
  }
  async getGoal(ctx: RequestContext) {
    const goal = await this.models.Goal.findOne({ ownerId: ctx.identity.id });
    if (!goal) throw new ApiError(404, 'GOAL_NOT_FOUND', 'Hydration goal not configured');
    return dto(goal);
  }
  async setGoal(ctx: RequestContext, body: Record<string, unknown>) {
    const targetMl = integer(body.targetMl, 'targetMl', 250, 20000);
    const timezone = timezoneOf(body.timezone);
    const source: GoalSource = body.source === 'suggested' ? 'suggested' : 'custom';
    const current = await this.models.Goal.findOne({ ownerId: ctx.identity.id });
    if (!current) return dto(await this.models.Goal.create({ ownerId: ctx.identity.id, targetMl, source, timezone, version: 1, history: [] }));
    const expectedVersion = body.version === undefined ? current.version : integer(body.version, 'version', 1, Number.MAX_SAFE_INTEGER);
    if (expectedVersion !== current.version) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Goal changed concurrently; read it again');
    const history = { version: current.version, targetMl: current.targetMl, source: current.source, timezone: current.timezone, changedAt: this.now() };
    const updated = await this.models.Goal.findOneAndUpdate({ ownerId: ctx.identity.id, version: current.version }, { $set: { targetMl, source, timezone, version: current.version + 1 }, $push: { history } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Goal changed concurrently; read it again');
    return dto(updated);
  }
  async history(ctx: RequestContext) {
    const goal = await this.models.Goal.findOne({ ownerId: ctx.identity.id });
    if (!goal) throw new ApiError(404, 'GOAL_NOT_FOUND', 'Hydration goal not configured');
    return { items: goal.history, currentVersion: goal.version };
  }
  async createIntake(ctx: RequestContext, body: Record<string, unknown>) {
    const amountMl = integer(body.amountMl, 'amountMl', 1, 10000);
    const timezone = timezoneOf(body.timezone);
    const consumedAt = body.consumedAt === undefined ? this.now() : instant(body.consumedAt, 'consumedAt');
    const idempotencyKey = text(body.idempotencyKey, 'idempotencyKey', 128);
    const existing = await this.models.Intake.findOne({ ownerId: ctx.identity.id, idempotencyKey });
    if (existing) return { item: dto(existing), created: false };
    try {
      const create = async (session?: import('mongoose').ClientSession) => this.models.Intake.create([{ ownerId: ctx.identity.id, amountMl, timezone, consumedAt, localDate: localDate(consumedAt, timezone), idempotencyKey }], session ? { session } : undefined).then((items) => items[0]);
      const item = outboxEnabled()
        ? await withOutboxTransaction(this.models.Intake.db, async (session) => {
          const created = await create(session);
          const goal = await this.models.Goal.findOne({ ownerId: ctx.identity.id }).session(session);
          if (goal) {
            const total = await this.models.Intake.aggregate([{ $match: { ownerId: ctx.identity.id, localDate: created.localDate, timezone: created.timezone } }, { $group: { _id: null, total: { $sum: '$amountMl' } } }]).session(session);
            if ((total[0]?.total ?? 0) >= goal.targetMl) {
              const eventId = `hydration-daily-${ctx.identity.id}-${created.localDate}`;
              const existingEvent = await this.models.Outbox.findOne({ eventId }).session(session);
              if (!existingEvent) {
                const event = newOutboxEvent('hydration.daily_goal.reached.v1', created._id.toHexString(), ctx.identity.id, { title: 'Objetivo de hidratação atingido', body: 'Atingiu o seu objetivo diário de hidratação.' });
                event.eventId = eventId;
                await this.models.Outbox.create([event], { session });
              }
            }
          }
          return created;
        })
        : await create();
      return { item: dto(item), created: true };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const duplicate = await this.models.Intake.findOne({ ownerId: ctx.identity.id, idempotencyKey });
        if (duplicate) return { item: dto(duplicate), created: false };
      }
      throw error;
    }
  }
  async updateIntake(ctx: RequestContext, intakeId: string, body: Record<string, unknown>) {
    const current = await this.models.Intake.findOne({ _id: id(intakeId, 'intakeId'), ownerId: ctx.identity.id });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Water intake not found');
    const amountMl = body.amountMl === undefined ? current.amountMl : integer(body.amountMl, 'amountMl', 1, 10000);
    const timezone = body.timezone === undefined ? current.timezone : timezoneOf(body.timezone);
    const consumedAt = body.consumedAt === undefined ? current.consumedAt : instant(body.consumedAt, 'consumedAt');
    const updated = await this.models.Intake.findOneAndUpdate({ _id: current._id, ownerId: ctx.identity.id, updatedAt: current.updatedAt }, { $set: { amountMl, timezone, consumedAt, localDate: localDate(consumedAt, timezone) } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Intake changed concurrently; read it again');
    return dto(updated);
  }
  async deleteIntake(ctx: RequestContext, intakeId: string) {
    const deleted = await this.models.Intake.findOneAndDelete({ _id: id(intakeId, 'intakeId'), ownerId: ctx.identity.id });
    if (!deleted) throw new ApiError(404, 'NOT_FOUND', 'Water intake not found');
    return { id: deleted._id.toHexString(), deleted: true };
  }
  async daily(ctx: RequestContext, date: string, timezone: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'INVALID_DATE', 'date must use YYYY-MM-DD');
    timezoneOf(timezone);
    const [items, goal] = await Promise.all([this.models.Intake.find({ ownerId: ctx.identity.id, localDate: date, timezone }).sort({ consumedAt: 1, _id: 1 }), this.models.Goal.findOne({ ownerId: ctx.identity.id })]);
    const totalMl = items.reduce((total, item) => total + item.amountMl, 0);
    return { date, timezone, items: items.map((item) => dto(item)), totalMl, targetMl: goal?.targetMl ?? null, percentage: goal ? Number(((totalMl / goal.targetMl) * 100).toFixed(2)) : null };
  }
  async historyIntakes(ctx: RequestContext, options: HydrationListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.from || options.to) filter.localDate = { ...(options.from ? { $gte: options.from } : {}), ...(options.to ? { $lte: options.to } : {}) };
    if (options.timezone) filter.timezone = timezoneOf(options.timezone);
    const [items, total] = await Promise.all([this.models.Intake.find(filter).sort({ consumedAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.Intake.countDocuments(filter)]);
    return { items: items.map((item) => dto(item)), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async getReminder(ctx: RequestContext) {
    const reminder = await this.models.Reminder.findOne({ ownerId: ctx.identity.id });
    if (!reminder) throw new ApiError(404, 'REMINDER_NOT_CONFIGURED', 'Hydration reminders not configured');
    return dto(reminder);
  }
  async setReminder(ctx: RequestContext, body: Record<string, unknown>) {
    const frequency = String(body.frequency) as ReminderFrequency;
    if (!['hourly', 'two_hourly', 'custom'].includes(frequency)) throw new ApiError(400, 'INVALID_FREQUENCY', 'frequency must be hourly, two_hourly, or custom');
    const intervalMinutes = frequency === 'hourly' ? 60 : frequency === 'two_hourly' ? 120 : integer(body.intervalMinutes, 'intervalMinutes', 15, 1440);
    const startTime = text(body.startTime, 'startTime', 5), endTime = text(body.endTime, 'endTime', 5);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) throw new ApiError(400, 'INVALID_TIME', 'startTime and endTime must use HH:mm');
    const timezone = timezoneOf(body.timezone), enabled = body.enabled === true;
    const current = await this.models.Reminder.findOne({ ownerId: ctx.identity.id });
    if (!current) return dto(await this.models.Reminder.create({ ownerId: ctx.identity.id, enabled, frequency, intervalMinutes, startTime, endTime, timezone, version: 1 }));
    const expectedVersion = body.version === undefined ? current.version : integer(body.version, 'version', 1, Number.MAX_SAFE_INTEGER);
    if (expectedVersion !== current.version) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Reminder changed concurrently; read it again');
    const updated = await this.models.Reminder.findOneAndUpdate({ ownerId: ctx.identity.id, version: current.version }, { $set: { enabled, frequency, intervalMinutes, startTime, endTime, timezone, version: current.version + 1 } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Reminder changed concurrently; read it again');
    return dto(updated);
  }
}
