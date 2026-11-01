import { randomUUID } from 'node:crypto';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { UserEncryption } from '../config/encryption';
import { expectedVersion, nextCursor, PageOptions } from '../config/http';
import {
  JsonObject, mergeFields, mergePreferences, preferenceDefaults, PROFILE_FIELDS, PREFERENCE_FIELDS,
  validateProfileConsistency, validateGoalConsistency, MeasurementInput,
} from '../config/validation';
import { UserModels } from '../models';
import { OwnedData } from '../models/common';
import { ProfileData } from '../models/user-profile.model';
import { PreferencesData } from '../models/user-preferences.model';
import { HabitData } from '../models/habit-profile.model';
import { MeasurementData, MEASUREMENT_KINDS } from '../models/body-measurement.model';
import { GoalData } from '../models/user-goal.model';

export interface Identity { id: string; name: string; email: string }
export interface RequestContext { identity: Identity; requestId: string }
type ResourceType = 'profile' | 'preferences' | 'habits' | 'measurements' | 'goals' | 'physical_data';
type Action = 'read' | 'create' | 'update';
type OwnedDocument<T extends OwnedData> = HydratedDocument<T>;
function pick(data: object, fields: readonly string[]): JsonObject {
  const source = data as JsonObject;
  return Object.fromEntries(fields.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]));
}
function metadata<T extends OwnedData>(doc: OwnedDocument<T>) {
  return { id: doc._id.toHexString(), authUserId: doc.authUserId, schemaVersion: doc.schemaVersion,
    version: doc.version, createdAt: doc.createdAt, updatedAt: doc.updatedAt };
}
function duplicate(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);
}

export class UserService {
  constructor(public readonly models: UserModels, private readonly encryption?: UserEncryption) {}
  private crypto(): UserEncryption {
    if (!this.encryption) throw new ApiError(503, 'USER_DATA_DISABLED', 'User data is not enabled');
    return this.encryption;
  }
  private context<T extends OwnedData>(collection: string, doc: OwnedDocument<T>) {
    return { collection, authUserId: doc.authUserId, id: doc._id.toHexString(), version: doc.version };
  }
  private async audit(context: RequestContext, resourceType: ResourceType, actionCode: Action,
    decision: 'intent' | 'allowed' | 'failed', result?: { id?: string; version?: number }): Promise<void> {
    try {
      await this.models.Audit.create({ eventId: randomUUID(), requestId: context.requestId,
        actorId: context.identity.id, subjectAuthUserId: context.identity.id, resourceType, actionCode, decision,
        resourceOpaqueId: result?.id, resourceVersion: result?.version, occurredAt: new Date(), dataMode: 'synthetic' });
    } catch {
      throw new ApiError(503, 'AUDIT_UNAVAILABLE', 'User data auditing is unavailable');
    }
  }
  private async operation<T>(context: RequestContext, type: ResourceType, action: Action, work: () => Promise<T>): Promise<T> {
    await this.audit(context, type, action, 'intent');
    try {
      const result = await work();
      const resource = result && typeof result === 'object' ? result as { id?: string; version?: number } : undefined;
      await this.audit(context, type, action, 'allowed', resource);
      return result;
    } catch (error) {
      try { await this.audit(context, type, action, 'failed'); }
      catch { console.error('user-service audit completion unavailable'); }
      throw error;
    }
  }
  private async requireProfile(owner: string) {
    const profile = await this.models.Profile.findOne({ authUserId: owner });
    if (!profile) throw new ApiError(404, 'PROFILE_REQUIRED', 'Create your personal profile first');
    if (['restricted', 'deletion_pending'].includes(profile.profileStatus)) {
      throw new ApiError(403, 'PROFILE_RESTRICTED', 'This profile is restricted');
    }
    return profile;
  }
  private notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Resource not found'); }
  private conflict(): never { throw new ApiError(412, 'VERSION_CONFLICT', 'Resource changed; read the current version'); }
  private profileDto(doc: OwnedDocument<ProfileData>) {
    return { ...metadata(doc), ...pick(doc.toObject(), PROFILE_FIELDS),
      profileStatus: doc.profileStatus, onboardingVersion: doc.onboardingVersion };
  }
  private preferencesDto(doc: OwnedDocument<PreferencesData>) {
    return { ...metadata(doc), ...pick(doc.toObject(), PREFERENCE_FIELDS) };
  }
  private habitsDto(doc: OwnedDocument<HabitData>) {
    return { ...metadata(doc), ...this.crypto().decrypt<JsonObject>(doc.payloadEncrypted, this.context('habit_profiles', doc)),
      declaredAt: doc.declaredAt, source: doc.source };
  }
  private measurementDto(doc: OwnedDocument<MeasurementData>) {
    return { ...metadata(doc), kind: doc.kind, value: this.crypto().decrypt<number>(doc.value, this.context('body_measurements', doc)),
      unit: doc.unit, measuredAt: doc.measuredAt, recordedAt: doc.recordedAt,
      recordedByAuthUserId: doc.recordedByAuthUserId, source: doc.source, status: doc.status };
  }
  private goalPayload(doc: OwnedDocument<GoalData>): JsonObject {
    return this.crypto().decrypt<JsonObject>(doc.payloadEncrypted, this.context('user_goals', doc));
  }
  private goalDto(doc: OwnedDocument<GoalData>) {
    return { ...metadata(doc), ...this.goalPayload(doc), goalType: doc.goalType, status: doc.status,
      createdByAuthUserId: doc.createdByAuthUserId };
  }

  async getProfile(ctx: RequestContext) {
    return this.operation(ctx, 'profile', 'read', async () => {
      const profile = await this.requireProfile(ctx.identity.id);
      return { ...this.profileDto(profile), identity: { ...ctx.identity } };
    });
  }
  async createProfile(ctx: RequestContext, input: JsonObject) {
    validateProfileConsistency(input);
    return this.operation(ctx, 'profile', 'create', async () => {
      try {
        const profile = await this.models.Profile.create({ ...input, authUserId: ctx.identity.id, profileStatus: 'draft', onboardingVersion: 1 });
        return this.profileDto(profile);
      } catch (error) {
        if (duplicate(error)) this.conflict();
        throw error;
      }
    });
  }
  async updateProfile(ctx: RequestContext, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'profile', 'update', async () => {
      const current = await this.requireProfile(ctx.identity.id);
      const version = expectedVersion(tag, current._id.toHexString());
      const data = mergeFields(pick(current.toObject(), PROFILE_FIELDS), patch);
      validateProfileConsistency(data);
      const unset = Object.fromEntries(PROFILE_FIELDS.filter((key) => !(key in data)).map((key) => [key, '']));
      const updated = await this.models.Profile.findOneAndUpdate(
        { _id: current._id, authUserId: ctx.identity.id, version, profileStatus: { $nin: ['restricted', 'deletion_pending'] } },
        { $set: { ...data, version: version + 1 }, $unset: unset }, { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict();
      return this.profileDto(updated);
    });
  }
  async getPreferences(ctx: RequestContext) {
    return this.operation(ctx, 'preferences', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const doc = await this.models.Preferences.findOne({ authUserId: ctx.identity.id });
      if (!doc) this.notFound();
      return this.preferencesDto(doc);
    });
  }
  async createPreferences(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'preferences', 'create', async () => {
      await this.requireProfile(ctx.identity.id);
      const data = mergePreferences(preferenceDefaults(), input);
      try { return this.preferencesDto(await this.models.Preferences.create({ ...data, authUserId: ctx.identity.id })); }
      catch (error) { if (duplicate(error)) this.conflict(); throw error; }
    });
  }
  async updatePreferences(ctx: RequestContext, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'preferences', 'update', async () => {
      await this.requireProfile(ctx.identity.id);
      const current = await this.models.Preferences.findOne({ authUserId: ctx.identity.id });
      if (!current) this.notFound();
      const version = expectedVersion(tag, current._id.toHexString());
      const data = mergePreferences(pick(current.toObject(), PREFERENCE_FIELDS), patch);
      const updated = await this.models.Preferences.findOneAndUpdate({ _id: current._id, authUserId: ctx.identity.id, version },
        { $set: { ...data, version: version + 1 }, ...(!('quietHours' in data) ? { $unset: { quietHours: '' } } : {}) },
        { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict();
      return this.preferencesDto(updated);
    });
  }
  async getHabits(ctx: RequestContext) {
    return this.operation(ctx, 'habits', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const doc = await this.models.Habit.findOne({ authUserId: ctx.identity.id }).select('+payloadEncrypted');
      if (!doc) this.notFound();
      return this.habitsDto(doc);
    });
  }
  async createHabits(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'habits', 'create', async () => {
      await this.requireProfile(ctx.identity.id);
      const _id = new Types.ObjectId();
      const payloadEncrypted = this.crypto().encrypt(mergeFields({}, input),
        { collection: 'habit_profiles', authUserId: ctx.identity.id, id: _id.toHexString(), version: 1 });
      try {
        return this.habitsDto(await this.models.Habit.create({ _id, authUserId: ctx.identity.id, payloadEncrypted,
          declaredAt: new Date(), source: 'self_reported' }));
      } catch (error) { if (duplicate(error)) this.conflict(); throw error; }
    });
  }
  async updateHabits(ctx: RequestContext, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'habits', 'update', async () => {
      await this.requireProfile(ctx.identity.id);
      const current = await this.models.Habit.findOne({ authUserId: ctx.identity.id }).select('+payloadEncrypted');
      if (!current) this.notFound();
      const version = expectedVersion(tag, current._id.toHexString());
      const data = mergeFields(this.crypto().decrypt<JsonObject>(current.payloadEncrypted, this.context('habit_profiles', current)), patch);
      const payloadEncrypted = this.crypto().encrypt(data, { ...this.context('habit_profiles', current), version: version + 1 });
      const updated = await this.models.Habit.findOneAndUpdate({ _id: current._id, authUserId: ctx.identity.id, version },
        { $set: { payloadEncrypted, version: version + 1, declaredAt: new Date() } },
        { returnDocument: 'after', runValidators: true }).select('+payloadEncrypted');
      if (!updated) this.conflict();
      return this.habitsDto(updated);
    });
  }

  async createMeasurement(ctx: RequestContext, input: MeasurementInput, key: string) {
    return this.operation(ctx, 'measurements', 'create', async () => {
      await this.requireProfile(ctx.identity.id);
      const inputFingerprint = this.crypto().fingerprint({ owner: ctx.identity.id, ...input, measuredAt: input.measuredAt.toISOString() });
      const existing = async () => this.models.Measurement.findOne({ authUserId: ctx.identity.id, idempotencyKey: key })
        .select('+value +inputFingerprint');
      const replay = (doc: OwnedDocument<MeasurementData>) => {
        if (doc.inputFingerprint !== inputFingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was used for different data');
        return { data: this.measurementDto(doc), replayed: true };
      };
      const previous = await existing();
      if (previous) return replay(previous);
      const _id = new Types.ObjectId();
      const value = this.crypto().encrypt(input.value, { collection: 'body_measurements', authUserId: ctx.identity.id, id: _id.toHexString(), version: 1 });
      try {
        const doc = await this.models.Measurement.create({ _id, authUserId: ctx.identity.id, kind: input.kind, unit: input.unit,
          value, measuredAt: input.measuredAt, recordedAt: new Date(), source: 'self', status: 'valid',
          recordedByAuthUserId: ctx.identity.id, idempotencyKey: key, inputFingerprint });
        return { data: this.measurementDto(doc), replayed: false };
      } catch (error) {
        if (duplicate(error)) { const doc = await existing(); if (doc) return replay(doc); }
        throw error;
      }
    });
  }
  async getMeasurement(ctx: RequestContext, id: string) {
    return this.operation(ctx, 'measurements', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const doc = await this.models.Measurement.findOne({ _id: id, authUserId: ctx.identity.id, status: 'valid' }).select('+value');
      if (!doc) this.notFound();
      return this.measurementDto(doc);
    });
  }
  async listMeasurements(ctx: RequestContext, page: PageOptions) {
    return this.operation(ctx, 'measurements', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const docs = await this.models.Measurement.find({ authUserId: ctx.identity.id, status: 'valid',
        ...(page.filter ? { kind: page.filter } : {}),
        ...(page.cursor ? { $or: [{ measuredAt: { $lt: page.cursor.at } }, { measuredAt: page.cursor.at, _id: { $lt: new Types.ObjectId(page.cursor.id) } }] } : {}),
      }).select('+value').sort({ measuredAt: -1, _id: -1 }).limit(page.limit + 1);
      const more = docs.length > page.limit, selected = docs.slice(0, page.limit), last = selected.at(-1);
      return { items: selected.map((doc) => this.measurementDto(doc)),
        nextCursor: more && last ? nextCursor(ctx.identity.id, 'measurements', page.filter, last.measuredAt, last._id.toHexString()) : null };
    });
  }
  async physicalData(ctx: RequestContext) {
    return this.operation(ctx, 'physical_data', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const data = await Promise.all(MEASUREMENT_KINDS.map(async (kind) => {
        const doc = await this.models.Measurement.findOne({ authUserId: ctx.identity.id, kind, status: 'valid' })
          .select('+value').sort({ measuredAt: -1, _id: -1 });
        return [kind, doc ? this.measurementDto(doc) : null];
      }));
      return { measurements: Object.fromEntries(data) };
    });
  }
  private async validateBaseline(owner: string, data: JsonObject): Promise<void> {
    validateGoalConsistency(data);
    if (!data.baselineMeasurementId) return;
    const measurement = await this.models.Measurement.findOne({ _id: data.baselineMeasurementId, authUserId: owner, status: 'valid' });
    if (!measurement) this.notFound();
    const metric = (data.target as JsonObject).metric;
    if (metric !== 'body_weight' || measurement.kind !== 'weight') throw new ApiError(400, 'VALIDATION_ERROR', 'Baseline does not match the target metric');
  }
  async createGoal(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'goals', 'create', async () => {
      await this.requireProfile(ctx.identity.id);
      await this.validateBaseline(ctx.identity.id, input);
      const _id = new Types.ObjectId();
      const payload = pick(input, ['title', 'description', 'target', 'baselineMeasurementId', 'startsOn', 'targetDate']);
      const payloadEncrypted = this.crypto().encrypt(mergeFields({}, payload),
        { collection: 'user_goals', authUserId: ctx.identity.id, id: _id.toHexString(), version: 1 });
      return this.goalDto(await this.models.Goal.create({ _id, authUserId: ctx.identity.id, goalType: String(input.goalType),
        status: String(input.status), payloadEncrypted, createdByAuthUserId: ctx.identity.id }));
    });
  }
  async getGoal(ctx: RequestContext, id: string) {
    return this.operation(ctx, 'goals', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const doc = await this.models.Goal.findOne({ _id: id, authUserId: ctx.identity.id }).select('+payloadEncrypted');
      if (!doc) this.notFound();
      return this.goalDto(doc);
    });
  }
  async updateGoal(ctx: RequestContext, id: string, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'goals', 'update', async () => {
      await this.requireProfile(ctx.identity.id);
      const current = await this.models.Goal.findOne({ _id: id, authUserId: ctx.identity.id }).select('+payloadEncrypted');
      if (!current) this.notFound();
      const version = expectedVersion(tag, id);
      const data = mergeFields({ ...this.goalPayload(current), goalType: current.goalType, status: current.status }, patch);
      await this.validateBaseline(ctx.identity.id, data);
      const payloadEncrypted = this.crypto().encrypt(pick(data, ['title', 'description', 'target', 'baselineMeasurementId', 'startsOn', 'targetDate']),
        { ...this.context('user_goals', current), version: version + 1 });
      const updated = await this.models.Goal.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, version },
        { $set: { goalType: data.goalType, status: data.status, payloadEncrypted, version: version + 1 } },
        { returnDocument: 'after', runValidators: true }).select('+payloadEncrypted');
      if (!updated) this.conflict();
      return this.goalDto(updated);
    });
  }
  async listGoals(ctx: RequestContext, page: PageOptions) {
    return this.operation(ctx, 'goals', 'read', async () => {
      await this.requireProfile(ctx.identity.id);
      const docs = await this.models.Goal.find({ authUserId: ctx.identity.id,
        ...(page.filter ? { status: page.filter } : {}),
        ...(page.cursor ? { $or: [{ createdAt: { $lt: page.cursor.at } }, { createdAt: page.cursor.at, _id: { $lt: new Types.ObjectId(page.cursor.id) } }] } : {}),
      }).select('+payloadEncrypted').sort({ createdAt: -1, _id: -1 }).limit(page.limit + 1);
      const selected = docs.slice(0, page.limit), last = selected.at(-1);
      return { items: selected.map((doc) => this.goalDto(doc)), nextCursor: docs.length > page.limit && last
        ? nextCursor(ctx.identity.id, 'goals', page.filter, last.createdAt, last._id.toHexString()) : null };
    });
  }
}
