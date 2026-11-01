import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { Difficulty, ExerciseData, ExerciseType, TrainingEnvironment } from '../models/exercise.model';
import { PlanExercise, TrainingPlanData } from '../models/plan.model';
import { TrainingModels } from '../models';
import { newOutboxEvent, withOutboxTransaction, outboxEnabled } from '../events/outbox';

const environments: TrainingEnvironment[] = ['home', 'gym', 'outdoor'];
const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const types: ExerciseType[] = ['strength', 'cardio', 'mobility', 'flexibility', 'balance'];
const isObjectId = (value: string) => Types.ObjectId.isValid(value);
const id = (value: string, field: string) => { if (!isObjectId(value)) throw new ApiError(400, 'INVALID_ID', `${field} must be a valid identifier`); return new Types.ObjectId(value); };
const text = (value: unknown, field: string, max: number, required = false) => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} is required and must be at most ${max} characters`);
  return value.trim();
};
const enumValue = <T extends string>(value: unknown, allowed: readonly T[], field: string) => {
  if (!allowed.includes(value as T)) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} is invalid`);
  return value as T;
};
const list = (value: unknown, field: string, max: number) => {
  if (!Array.isArray(value) || value.length > max || value.some((item) => typeof item !== 'string' || !item.trim())) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} must be a list of at most ${max} non-empty strings`);
  return value.map((item) => String(item).trim());
};
function positive(value: unknown, field: string, max: number, allowZero = false) {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || (allowZero ? value < 0 : value < 1) || value > max) throw new ApiError(400, `INVALID_${field.toUpperCase()}`, `${field} is invalid`);
  return value;
}
function exerciseInput(body: Record<string, unknown>, ownerId?: string): Partial<ExerciseData> {
  const environmentsValue = list(body.environments, 'environments', 3).map((value) => enumValue(value, environments, 'environment'));
  if (!environmentsValue.length) throw new ApiError(400, 'INVALID_ENVIRONMENTS', 'At least one environment is required');
  return {
    ...(ownerId ? { ownerId } : {}),
    name: text(body.name, 'name', 160, true),
    description: text(body.description, 'description', 2000),
    muscleGroup: text(body.muscleGroup, 'muscleGroup', 80, true),
    equipment: list(body.equipment, 'equipment', 20),
    environments: environmentsValue,
    difficulty: enumValue(body.difficulty, difficulties, 'difficulty'),
    type: enumValue(body.type, types, 'type'),
    instructions: text(body.instructions, 'instructions', 4000, true),
  };
}
function planExerciseInput(value: unknown): PlanExercise {
  if (!value || typeof value !== 'object') throw new ApiError(400, 'INVALID_EXERCISE', 'Each plan exercise must be an object');
  const body = value as Record<string, unknown>;
  return {
    exerciseId: id(String(body.exerciseId), 'exerciseId'),
    sets: positive(body.sets, 'sets', 100),
    repetitions: positive(body.repetitions, 'repetitions', 1000),
    load: positive(body.load, 'load', 100000, true),
    durationSeconds: positive(body.durationSeconds, 'durationSeconds', 86400),
    restSeconds: positive(body.restSeconds, 'restSeconds', 86400, true),
    day: text(body.day, 'day', 30),
  };
}
function planInput(body: Record<string, unknown>, partial = false): Partial<TrainingPlanData> {
  const result: Partial<TrainingPlanData> = {};
  if (!partial || body.title !== undefined) result.title = text(body.title, 'title', 160, true);
  if (body.description !== undefined) result.description = text(body.description, 'description', 2000);
  if (!partial || body.goals !== undefined) result.goals = list(body.goals ?? [], 'goals', 20);
  if (!partial || body.days !== undefined) result.days = list(body.days ?? [], 'days', 14);
  if (body.environment !== undefined) result.environment = enumValue(body.environment, environments, 'environment');
  if (!partial || body.exercises !== undefined) {
    if (!Array.isArray(body.exercises) || body.exercises.length > 100) throw new ApiError(400, 'INVALID_EXERCISES', 'exercises must contain at most 100 items');
    result.exercises = body.exercises.map(planExerciseInput);
  }
  return result;
}
const exerciseDto = (doc: HydratedDocument<ExerciseData>) => { const value = doc.toObject(); return { id: doc._id.toHexString(), ...value, _id: undefined }; };
const planDto = (doc: HydratedDocument<TrainingPlanData>) => { const value = doc.toObject(); return { id: doc._id.toHexString(), ...value, _id: undefined }; };
const sessionDto = (doc: HydratedDocument<import('../models/session.model').TrainingSessionData>) => {
  const value = doc.toObject();
  return { id: doc._id.toHexString(), ...value, _id: undefined };
};

export interface ListOptions { page: number; pageSize: number; status?: 'active' | 'archived'; environment?: TrainingEnvironment; difficulty?: Difficulty; type?: ExerciseType; muscleGroup?: string }
export class TrainingService {
  constructor(private readonly models: TrainingModels, private readonly now = () => new Date()) {}

  async listExercises(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: ctx.identity.id }] };
    if (options.environment) filter.environments = options.environment;
    if (options.difficulty) filter.difficulty = options.difficulty;
    if (options.type) filter.type = options.type;
    if (options.muscleGroup) filter.muscleGroup = options.muscleGroup;
    const [items, total] = await Promise.all([
      this.models.Exercise.find(filter).sort({ name: 1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize),
      this.models.Exercise.countDocuments(filter),
    ]);
    return { items: items.map(exerciseDto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async createExercise(ctx: RequestContext, body: Record<string, unknown>) {
    return exerciseDto(await this.models.Exercise.create(exerciseInput(body, ctx.identity.id)));
  }
  async getExercise(ctx: RequestContext, exerciseId: string) {
    const doc = await this.models.Exercise.findOne({ _id: id(exerciseId, 'exerciseId'), $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: ctx.identity.id }] });
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found');
    return exerciseDto(doc);
  }
  async createPlan(ctx: RequestContext, body: Record<string, unknown>) {
    const data = planInput(body);
    await this.assertExercisesAccessible(ctx, data.exercises || []);
    return planDto(await this.models.Plan.create({ ...data, ownerId: ctx.identity.id, status: 'active', version: 1, history: [] }));
  }
  async listPlans(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.status) filter.status = options.status;
    const [items, total] = await Promise.all([
      this.models.Plan.find(filter).sort({ updatedAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize),
      this.models.Plan.countDocuments(filter),
    ]);
    return { items: items.map(planDto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async getPlan(ctx: RequestContext, planId: string) {
    const doc = await this.models.Plan.findOne({ _id: id(planId, 'planId'), ownerId: ctx.identity.id });
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Training plan not found');
    return planDto(doc);
  }
  async updatePlan(ctx: RequestContext, planId: string, body: Record<string, unknown>) {
    const plan = await this.models.Plan.findOne({ _id: id(planId, 'planId'), ownerId: ctx.identity.id });
    if (!plan) throw new ApiError(404, 'NOT_FOUND', 'Training plan not found');
    if (plan.status === 'archived') throw new ApiError(409, 'PLAN_ARCHIVED', 'Archived plans cannot be edited');
    const data = planInput(body, true);
    await this.assertExercisesAccessible(ctx, data.exercises || plan.exercises);
    const nextVersion = plan.version + 1;
    const snapshot = { version: plan.version, title: plan.title, description: plan.description, goals: plan.goals, days: plan.days, environment: plan.environment, exercises: plan.exercises, changedAt: this.now() };
    const updated = await this.models.Plan.findOneAndUpdate({ _id: plan._id, ownerId: ctx.identity.id, version: plan.version, status: 'active' }, { $set: { ...data, version: nextVersion }, $push: { history: snapshot } }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Plan changed concurrently; read it again');
    return planDto(updated);
  }
  async archivePlan(ctx: RequestContext, planId: string) {
    const updated = await this.models.Plan.findOneAndUpdate({ _id: id(planId, 'planId'), ownerId: ctx.identity.id, status: 'active' }, { $set: { status: 'archived' }, $inc: { version: 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(404, 'NOT_FOUND', 'Active training plan not found');
    return planDto(updated);
  }
  async duplicatePlan(ctx: RequestContext, planId: string) {
    const source = await this.models.Plan.findOne({ _id: id(planId, 'planId'), ownerId: ctx.identity.id });
    if (!source) throw new ApiError(404, 'NOT_FOUND', 'Training plan not found');
    const copy = source.toObject();
    delete (copy as { _id?: unknown })._id;
    delete (copy as { createdAt?: unknown }).createdAt;
    delete (copy as { updatedAt?: unknown }).updatedAt;
    return planDto(await this.models.Plan.create({ ...copy, title: `${source.title} (copy)`, version: 1, history: [], status: 'active' }));
  }
  async addPlanExercise(ctx: RequestContext, planId: string, body: Record<string, unknown>) {
    const plan = await this.getPlanDocument(ctx, planId);
    const item = planExerciseInput(body);
    await this.assertExercisesAccessible(ctx, [item]);
    const snapshot = { version: plan.version, title: plan.title, description: plan.description, goals: plan.goals, days: plan.days, environment: plan.environment, exercises: plan.exercises, changedAt: this.now() };
    const updated = await this.models.Plan.findOneAndUpdate({ _id: plan._id, ownerId: ctx.identity.id, version: plan.version, status: 'active' }, { $push: { exercises: item, history: snapshot }, $inc: { version: 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Plan changed concurrently; read it again');
    return planDto(updated);
  }
  async removePlanExercise(ctx: RequestContext, planId: string, exerciseId: string) {
    const plan = await this.getPlanDocument(ctx, planId);
    const snapshot = { version: plan.version, title: plan.title, description: plan.description, goals: plan.goals, days: plan.days, environment: plan.environment, exercises: plan.exercises, changedAt: this.now() };
    const updated = await this.models.Plan.findOneAndUpdate({ _id: plan._id, ownerId: ctx.identity.id, version: plan.version, status: 'active' }, { $pull: { exercises: { exerciseId: id(exerciseId, 'exerciseId') } }, $push: { history: snapshot }, $inc: { version: 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Plan changed concurrently; read it again');
    return planDto(updated);
  }
  async createSession(ctx: RequestContext, body: Record<string, unknown>) {
    let planId: Types.ObjectId | undefined;
    if (body.planId !== undefined) { planId = id(String(body.planId), 'planId'); const plan = await this.models.Plan.findOne({ _id: planId, ownerId: ctx.identity.id }); if (!plan) throw new ApiError(404, 'NOT_FOUND', 'Training plan not found'); }
    return sessionDto(await this.models.Session.create({ ownerId: ctx.identity.id, planId, status: 'planned', exercises: [], version: 1 }));
  }
  async listSessions(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.status) filter.status = options.status;
    const [items, total] = await Promise.all([this.models.Session.find(filter).sort({ createdAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.Session.countDocuments(filter)]);
    return { items: items.map((item) => sessionDto(item)), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async getSession(ctx: RequestContext, sessionId: string) {
    const doc = await this.models.Session.findOne({ _id: id(sessionId, 'sessionId'), ownerId: ctx.identity.id });
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Training session not found');
    return sessionDto(doc);
  }
  async transitionSession(ctx: RequestContext, sessionId: string, action: 'start' | 'pause' | 'resume' | 'complete' | 'cancel') {
    const session = await this.models.Session.findOne({ _id: id(sessionId, 'sessionId'), ownerId: ctx.identity.id });
    if (!session) throw new ApiError(404, 'NOT_FOUND', 'Training session not found');
    const now = this.now();
    const allowed: Record<string, string[]> = { start: ['planned'], pause: ['running'], resume: ['paused'], complete: ['running', 'paused'], cancel: ['planned', 'running', 'paused'] };
    if (action === 'complete' && session.status === 'completed') return sessionDto(session);
    if (action === 'cancel' && session.status === 'cancelled') return sessionDto(session);
    if (!allowed[action].includes(session.status)) throw new ApiError(409, 'INVALID_SESSION_TRANSITION', `Cannot ${action} a ${session.status} session`);
    const set: Record<string, unknown> = {}, inc = { version: 1 };
    if (action === 'start') { set.status = 'running'; set.startedAt = now; }
    if (action === 'pause') { set.status = 'paused'; set.pausedAt = now; }
    if (action === 'resume') { set.status = 'running'; set.pausedAt = undefined; }
    if (action === 'complete') { set.status = 'completed'; set.completedAt = now; set.durationSeconds = session.startedAt ? Math.max(0, Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)) : 0; }
    if (action === 'cancel') { set.status = 'cancelled'; }
    const updated = outboxEnabled() && action === 'complete'
      ? await withOutboxTransaction(this.models.Session.db, async (transactionSession) => {
        const completed = await this.models.Session.findOneAndUpdate({ _id: session._id, ownerId: ctx.identity.id, status: session.status, version: session.version }, { $set: set, $inc: inc }, { returnDocument: 'after', session: transactionSession });
        if (completed) await this.models.Outbox.create([newOutboxEvent('training.session.completed.v1', completed._id.toHexString(), ctx.identity.id, { title: 'Treino concluído', body: 'A sua sessão de treino foi concluída.' })], { session: transactionSession });
        return completed;
      })
      : await this.models.Session.findOneAndUpdate({ _id: session._id, ownerId: ctx.identity.id, status: session.status, version: session.version }, { $set: set, $inc: inc }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Session changed concurrently; read it again');
    return sessionDto(updated);
  }
  async recordExercise(ctx: RequestContext, sessionId: string, body: Record<string, unknown>) {
    const session = await this.models.Session.findOne({ _id: id(sessionId, 'sessionId'), ownerId: ctx.identity.id });
    if (!session) throw new ApiError(404, 'NOT_FOUND', 'Training session not found');
    if (!['running', 'paused'].includes(session.status)) throw new ApiError(409, 'SESSION_NOT_ACTIVE', 'Exercises can only be recorded on an active session');
    const item = body as { exerciseId?: unknown; sets?: unknown; notes?: unknown };
    const exerciseId = id(String(item.exerciseId), 'exerciseId');
    const exercise = await this.models.Exercise.findOne({ _id: exerciseId, $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: ctx.identity.id }] });
    if (!exercise) throw new ApiError(400, 'EXERCISE_NOT_ACCESSIBLE', 'Exercise is not accessible');
    if (!Array.isArray(item.sets) || item.sets.length > 100) throw new ApiError(400, 'INVALID_SETS', 'sets must be a list with at most 100 items');
    const sets = item.sets.map((set) => {
      if (!set || typeof set !== 'object') throw new ApiError(400, 'INVALID_SET', 'Each set must be an object');
      const value = set as Record<string, unknown>;
      return { repetitions: positive(value.repetitions, 'repetitions', 1000), load: positive(value.load, 'load', 100000, true), durationSeconds: positive(value.durationSeconds, 'durationSeconds', 86400) };
    });
    const updated = await this.models.Session.findOneAndUpdate({ _id: session._id, ownerId: ctx.identity.id, version: session.version, status: { $in: ['running', 'paused'] } }, { $push: { exercises: { exerciseId, sets, notes: text(item.notes, 'notes', 2000) } }, $inc: { version: 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Session changed concurrently; read it again');
    return sessionDto(updated);
  }
  private async getPlanDocument(ctx: RequestContext, planId: string) {
    const plan = await this.models.Plan.findOne({ _id: id(planId, 'planId'), ownerId: ctx.identity.id });
    if (!plan) throw new ApiError(404, 'NOT_FOUND', 'Training plan not found');
    if (plan.status === 'archived') throw new ApiError(409, 'PLAN_ARCHIVED', 'Archived plans cannot be edited');
    return plan;
  }
  private async assertExercisesAccessible(ctx: RequestContext, exercises: PlanExercise[]) {
    const ids = exercises.map((item) => item.exerciseId);
    if (!ids.length) return;
    const found = await this.models.Exercise.countDocuments({ _id: { $in: ids }, $or: [{ ownerId: { $exists: false } }, { ownerId: null }, { ownerId: ctx.identity.id }] });
    if (found !== new Set(ids.map(String)).size) throw new ApiError(400, 'EXERCISE_NOT_ACCESSIBLE', 'One or more exercises are not accessible');
  }
}
