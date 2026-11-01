import { HydratedDocument } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { ActivityData, ActivityKind, ActivityStatus, WorkoutEnvironment } from '../models/activity.model';
import { AgendaModels } from '../models';

export interface ActivityInput { title: string; description?: string; kind: ActivityKind; environment?: WorkoutEnvironment; startAt: string; endAt: string; timezone: string; status?: ActivityStatus }
export interface ActivityPatch { title?: string; description?: string; kind?: ActivityKind; environment?: WorkoutEnvironment; startAt?: string; endAt?: string; timezone?: string }
export interface PageOptions { page: number; pageSize: number; status?: ActivityStatus; kind?: ActivityKind; environment?: WorkoutEnvironment; from?: Date; to?: Date }

function date(value: string, field: string): Date {
  const result = new Date(value);
  if (!value || Number.isNaN(result.getTime())) throw new ApiError(400, 'INVALID_DATE', `${field} must be a valid ISO date`);
  return result;
}
function timezone(value: string): string {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); return value; }
  catch { throw new ApiError(400, 'INVALID_TIMEZONE', 'timezone must be a valid IANA timezone'); }
}
function validateInput(input: Record<string, unknown>, partial = false): Record<string, unknown> {
  const value = input as Record<string, unknown>, result: Record<string, unknown> = {};
  if (!partial || value.title !== undefined) {
    if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 160) throw new ApiError(400, 'INVALID_TITLE', 'title is required and must be at most 160 characters');
    result.title = value.title.trim();
  }
  for (const field of ['description'] as const) if (value[field] !== undefined) {
    if (typeof value[field] !== 'string' || value[field].length > 2000) throw new ApiError(400, 'INVALID_DESCRIPTION', 'description must be at most 2000 characters');
    result[field] = value[field];
  }
  if (!partial || value.kind !== undefined) {
    if (value.kind !== 'personal' && value.kind !== 'workout') throw new ApiError(400, 'INVALID_KIND', 'kind must be personal or workout');
    result.kind = value.kind;
  }
  if (!partial || value.environment !== undefined) {
    if (value.environment !== undefined && !['home', 'gym', 'outdoor'].includes(String(value.environment))) throw new ApiError(400, 'INVALID_ENVIRONMENT', 'environment must be home, gym, or outdoor');
    if (value.environment !== undefined) result.environment = value.environment;
  }
  if (!partial || value.startAt !== undefined) result.startAt = date(String(value.startAt), 'startAt');
  if (!partial || value.endAt !== undefined) result.endAt = date(String(value.endAt), 'endAt');
  if (!partial || value.timezone !== undefined) result.timezone = timezone(String(value.timezone));
  if (result.startAt && result.endAt && (result.endAt as Date) <= (result.startAt as Date)) throw new ApiError(400, 'INVALID_INTERVAL', 'endAt must be after startAt');
  if (result.kind === 'workout' && !result.environment) throw new ApiError(400, 'INVALID_ENVIRONMENT', 'Workout environment is required');
  if (result.kind === 'personal' && result.environment) throw new ApiError(400, 'INVALID_ENVIRONMENT', 'Personal activities cannot have an environment');
  return result;
}
function dto(doc: HydratedDocument<ActivityData>) {
  return { id: doc._id.toHexString(), ...doc.toObject(), _id: undefined };
}
export class AgendaService {
  constructor(private readonly models: AgendaModels, private readonly now = () => new Date()) {}
  private async overlaps(owner: string, startAt: Date, endAt: Date, exclude?: string) {
    const query: Record<string, unknown> = { authUserId: owner, status: 'planned', startAt: { $lt: endAt }, endAt: { $gt: startAt } };
    if (exclude) query._id = { $ne: exclude };
    return this.models.Activity.find(query).sort({ startAt: 1 }).limit(20).lean();
  }
  async create(ctx: RequestContext, input: ActivityInput) {
    const data = validateInput(input as unknown as Record<string, unknown>), now = this.now();
    const startAt = data.startAt as Date, endAt = data.endAt as Date;
    const status = input.status || 'planned';
    if (status !== 'planned' && status !== 'completed') throw new ApiError(400, 'INVALID_STATUS', 'New activities may only be planned or completed');
    if (startAt < now && !(status === 'completed' && endAt <= now)) throw new ApiError(422, 'PAST_ACTIVITY_MUST_BE_COMPLETED', 'Past activities must be created as completed');
    if (status === 'completed' && endAt > now) throw new ApiError(422, 'ACTIVITY_NOT_FINISHED', 'An activity can only be completed after its end time');
    const doc = await this.models.Activity.create({ ...data, authUserId: ctx.identity.id, status });
    const conflicts = await this.overlaps(ctx.identity.id, doc.startAt, doc.endAt, doc._id.toHexString());
    return { activity: dto(doc), overlapWarning: conflicts.length > 0, overlaps: conflicts.map((item) => String(item._id)) };
  }
  async list(ctx: RequestContext, options: PageOptions) {
    const filter: Record<string, unknown> = { authUserId: ctx.identity.id };
    for (const key of ['status', 'kind', 'environment'] as const) if (options[key]) filter[key] = options[key];
    if (options.from || options.to) filter.startAt = { ...(options.from ? { $gte: options.from } : {}), ...(options.to ? { $lte: options.to } : {}) };
    const [items, total] = await Promise.all([
      this.models.Activity.find(filter).sort({ startAt: 1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize),
      this.models.Activity.countDocuments(filter),
    ]);
    return { items: items.map(dto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async get(ctx: RequestContext, id: string) {
    const doc = await this.models.Activity.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Activity not found');
    return dto(doc);
  }
  async update(ctx: RequestContext, id: string, patch: ActivityPatch) {
    const current = await this.models.Activity.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Activity not found');
    const now = this.now();
    if (current.status !== 'planned') throw new ApiError(409, 'ACTIVITY_FINAL', 'Final activities cannot be edited');
    if (current.startAt <= now) throw new ApiError(422, 'ACTIVITY_STARTED', 'Activities can only be edited before their start time');
    const data = validateInput({ ...current.toObject(), ...patch } as Record<string, unknown>, false);
    const updated = await this.models.Activity.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, status: 'planned', version: current.version, startAt: { $gt: now } }, { $set: data, $inc: { version: 1 } }, { new: true, runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Activity changed concurrently; read it again');
    const conflicts = await this.overlaps(ctx.identity.id, updated.startAt, updated.endAt, id);
    return { activity: dto(updated), overlapWarning: conflicts.length > 0, overlaps: conflicts.map((item) => String(item._id)) };
  }
  async complete(ctx: RequestContext, id: string) {
    const now = this.now();
    const updated = await this.models.Activity.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, status: 'planned', endAt: { $lte: now } }, { $set: { status: 'completed', completedAt: now }, $inc: { version: 1 } }, { new: true });
    if (updated) return dto(updated);
    const current = await this.models.Activity.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Activity not found');
    if (current.status !== 'planned') throw new ApiError(409, 'ACTIVITY_FINAL', 'Final activities cannot be reopened');
    throw new ApiError(422, 'ACTIVITY_NOT_FINISHED', 'An activity can only be completed after its end time');
  }
  async cancel(ctx: RequestContext, id: string) {
    const updated = await this.models.Activity.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, status: 'planned' }, { $set: { status: 'cancelled', cancelledAt: this.now() }, $inc: { version: 1 } }, { new: true });
    if (updated) return dto(updated);
    const current = await this.models.Activity.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Activity not found');
    throw new ApiError(409, 'ACTIVITY_FINAL', 'Only planned activities can be cancelled');
  }
}
