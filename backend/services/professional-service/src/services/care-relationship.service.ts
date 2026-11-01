import { createHash, randomUUID } from 'node:crypto';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { expectedVersion, PageOptions } from '../config/http';
import { RelationshipInput } from '../config/relationship-validation';
import { ProfessionalModels } from '../models';
import { CareRelationshipData, RelationshipAction, RelationshipKind, RelationshipState, RelationshipTransition } from '../models/care-relationship.model';
import { RequestContext } from './professional.service';
import { CareEligibilityProvider, EligibleCareCapability } from './care-eligibility.service';
type RelationshipDoc = HydratedDocument<CareRelationshipData>;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const isId = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value);
export class CareRelationshipService {
  constructor(public readonly models: ProfessionalModels, private readonly eligibility: CareEligibilityProvider,
    private readonly ttlDays = 7, private readonly clock: () => Date = () => new Date()) {
    if (!Number.isSafeInteger(ttlDays) || ttlDays < 1 || ttlDays > 365) throw new Error('Invalid care invitation lifetime');
  }
  private now(): Date {
    const result = this.clock();
    if (!(result instanceof Date) || !Number.isFinite(result.getTime())) throw new ApiError(503, 'CLOCK_UNAVAILABLE', 'Server time is unavailable');
    return new Date(result.getTime());
  }
  private async audit(ctx: RequestContext, actionCode: 'create' | 'read' | 'update', decision: 'intent' | 'allowed' | 'failed', id?: string) {
    try { await this.models.Audit.create({ eventId: randomUUID(), requestId: ctx.requestId, actorId: ctx.identity.id,
      purposeCode: 'synthetic_relationship', resourceType: 'relationship', actionCode, decision, resourceOpaqueId: id,
      occurredAt: this.now(), dataMode: 'synthetic' }); }
    catch { throw new ApiError(503, 'AUDIT_UNAVAILABLE', 'Relationship auditing is unavailable'); }
  }
  private async audited<T>(ctx: RequestContext, action: 'create' | 'read' | 'update', work: () => Promise<T>, id?: string): Promise<T> {
    await this.audit(ctx, action, 'intent', id);
    try { const result = await work(); await this.audit(ctx, action, 'allowed', id); return result; }
    catch (error) { try { await this.audit(ctx, action, 'failed', id); } catch { console.error('professional-service relationship audit completion unavailable'); } throw error; }
  }
  private notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Relationship or eligible professional not found'); }
  private conflict(): never { throw new ApiError(412, 'VERSION_CONFLICT', 'Relationship changed; read the current version'); }
  private unavailable(): never { throw new ApiError(503, 'ELIGIBILITY_UNAVAILABLE', 'Professional eligibility cannot be confirmed'); }
  private historyLimit(doc: RelationshipDoc) {
    if (doc.history.length >= 8) throw new ApiError(409, 'RELATIONSHIP_HISTORY_LIMIT', 'Relationship transition limit reached; no state was changed');
  }
  private dto(doc: RelationshipDoc) {
    return { id: doc._id.toHexString(), relationshipKind: doc.relationshipKind, status: doc.status, version: doc.version,
      createdAt: doc.createdAt, updatedAt: doc.updatedAt, expiresAt: doc.expiresAt,
      ...(doc.acceptedAt ? { acceptedAt: doc.acceptedAt } : {}), ...(doc.closedAt ? { closedAt: doc.closedAt } : {}),
      access: 'metadata_only', sensitiveDataAuthorized: false };
  }
  private event(ctx: RequestContext, version: number, action: RelationshipAction, from: RelationshipState | undefined,
    to: RelationshipState, actorType: RelationshipTransition['actorType'], key?: string, fingerprint?: string): RelationshipTransition {
    const reasons: Record<RelationshipAction, string> = { created: 'request_created', accept: 'professional_accepted', decline: 'professional_declined',
      cancel: 'requester_cancelled', end: 'participant_ended', expire: 'invitation_expired' };
    return { eventId: randomUUID(), relationshipVersion: version, action, ...(from ? { from } : {}), to, actorType,
      ...(actorType !== 'system' ? { actorAuthUserId: ctx.identity.id } : {}), occurredAt: this.now(), requestId: ctx.requestId,
      reasonCode: reasons[action], ...(key ? { commandKeyHash: hash(key), commandFingerprint: fingerprint } : {}) };
  }
  private async owned(ctx: RequestContext, id: string) {
    const doc = await this.models.Relationship.findOne({ _id: id,
      $or: [{ subjectAuthUserId: ctx.identity.id }, { professionalAuthUserId: ctx.identity.id }] }).select('+history');
    if (!doc) this.notFound(); return doc;
  }
  private async decision(professionalId: string, capabilityId: string) {
    try {
      const result = await this.eligibility.check(professionalId, capabilityId);
      if (!result || !['eligible', 'ineligible', 'unavailable'].includes(result.status)) return this.unavailable();
      return result;
    } catch { return this.unavailable(); }
  }
  private target(input: RelationshipInput, target: EligibleCareCapability, owner?: string): EligibleCareCapability {
    if (!target || target.professionalId !== input.professionalId || target.capabilityId !== input.capabilityId
      || !['personal_training', 'nutrition'].includes(target.relationshipKind) || !isId(target.professionalAuthUserId)
      || typeof target.professionalName !== 'string' || (owner && target.professionalAuthUserId !== owner)) this.unavailable();
    if (target.relationshipKind !== input.relationshipKind) throw new ApiError(400, 'CAPABILITY_KIND_MISMATCH', 'Activity does not match the selected capability');
    return target;
  }
  private async eligible(input: RelationshipInput, owner?: string): Promise<EligibleCareCapability> {
    const decision = await this.decision(input.professionalId, input.capabilityId);
    if (decision.status === 'unavailable') this.unavailable();
    if (decision.status !== 'eligible') this.notFound();
    return this.target(input, decision.capability, owner);
  }
  private async expire(ctx: RequestContext, original: RelationshipDoc): Promise<RelationshipDoc> {
    let doc = original;
    for (let attempt = 0; attempt < 8; attempt++) {
      const now = this.now();
      if (doc.status !== 'pending' || doc.expiresAt.getTime() > now.getTime()) return doc;
      this.historyLimit(doc);
      const event = this.event(ctx, doc.version + 1, 'expire', 'pending', 'expired', 'system');
      const updated = await this.models.Relationship.findOneAndUpdate({ _id: doc._id, version: doc.version, status: 'pending',
        expiresAt: { $lte: now }, 'history.7': { $exists: false } },
      { $set: { status: 'expired', isOpen: false, version: doc.version + 1, closedAt: event.occurredAt, updatedAt: event.occurredAt }, $push: { history: event } },
      { returnDocument: 'after', runValidators: true, timestamps: false }).select('+history');
      if (updated) return updated;
      const latest = await this.models.Relationship.findById(doc._id).select('+history'); if (!latest) this.notFound(); doc = latest;
    }
    throw new ApiError(409, 'RELATIONSHIP_BUSY', 'Relationship is being changed; retry later');
  }
  async create(ctx: RequestContext, input: RelationshipInput, key: string) {
    return this.audited(ctx, 'create', async () => {
      const fingerprint = hash(input), creationKeyHash = hash(key);
      const replay = async () => {
        const doc = await this.models.Relationship.findOne({ subjectAuthUserId: ctx.identity.id, creationKeyHash }).select('+creationFingerprint +history');
        if (!doc) return undefined;
        if (doc.creationFingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was used for different data');
        return { data: this.dto(await this.expire(ctx, doc)), replayed: true };
      };
      const previous = await replay(); if (previous) return previous;
      const target = await this.eligible(input);
      if (target.professionalAuthUserId === ctx.identity.id) throw new ApiError(403, 'SELF_RELATIONSHIP_FORBIDDEN', 'Self-association is not allowed');
      const open = await this.models.Relationship.findOne({ subjectAuthUserId: ctx.identity.id, professionalId: input.professionalId,
        relationshipKind: input.relationshipKind, isOpen: true }).select('+history');
      if (open) {
        const current = await this.expire(ctx, open);
        if (current.isOpen) {
          const completed = await replay(); if (completed) return completed;
          throw new ApiError(409, 'RELATIONSHIP_EXISTS', 'A pending or active relationship already exists for this activity');
        }
      }
      // Recheck immediately before the business write; never authorize from a cached directory entry.
      await this.eligible(input, target.professionalAuthUserId);
      const now = this.now(), event = this.event(ctx, 1, 'created', undefined, 'pending', 'requester', key, fingerprint);
      try {
        const doc = await this.models.Relationship.create({ subjectAuthUserId: ctx.identity.id, professionalAuthUserId: target.professionalAuthUserId,
          professionalId: input.professionalId, capabilityId: input.capabilityId, relationshipKind: input.relationshipKind,
          status: 'pending', isOpen: true, version: 1, history: [event], createdAt: now, updatedAt: now,
          expiresAt: new Date(now.getTime() + this.ttlDays * 86400000), creationKeyHash, creationFingerprint: fingerprint });
        return { data: this.dto(doc), replayed: false };
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
          const result = await replay(); if (result) return result;
          throw new ApiError(409, 'RELATIONSHIP_EXISTS', 'A pending or active relationship already exists for this activity');
        }
        throw error;
      }
    });
  }
  async get(ctx: RequestContext, id: string) {
    return this.audited(ctx, 'read', async () => this.dto(await this.expire(ctx, await this.owned(ctx, id))), id);
  }
  async history(ctx: RequestContext, id: string) {
    return this.audited(ctx, 'read', async () => {
      const doc = await this.expire(ctx, await this.owned(ctx, id));
      return { id: doc._id.toHexString(), version: doc.version, items: doc.history.map((event) => ({ eventId: event.eventId,
        version: event.relationshipVersion, action: event.action, ...(event.from ? { from: event.from } : {}), to: event.to,
        actorType: event.actorType, occurredAt: event.occurredAt, reasonCode: event.reasonCode })) };
    }, id);
  }
  async list(ctx: RequestContext, page: PageOptions & { status?: RelationshipState }, inbox = false) {
    return this.audited(ctx, 'read', async () => {
      let capabilities: string[] = [];
      if (inbox) {
        if (ctx.identity.userType !== 'profissional') throw new ApiError(403, 'PROFESSIONAL_REQUIRED', 'Current professional authorization is required');
        try { capabilities = await this.eligibility.authorizedCapabilities(ctx.identity); } catch { this.unavailable(); }
        if (!Array.isArray(capabilities) || capabilities.length > 100 || capabilities.some((id) => !isId(id))) this.unavailable();
        if (!capabilities.length) return { items: [], nextBefore: null };
      }
      const now = this.now();
      const status = page.status === 'expired' ? { $or: [{ status: 'expired' as const }, { status: 'pending' as const, expiresAt: { $lte: now } }] }
        : page.status ? { status: page.status } : {};
      const participant = inbox ? { professionalAuthUserId: ctx.identity.id, capabilityId: { $in: capabilities.map((id) => new Types.ObjectId(id)) } }
        : { $or: [{ subjectAuthUserId: ctx.identity.id }, { professionalAuthUserId: ctx.identity.id }] };
      const docs = await this.models.Relationship.find({ $and: [participant, status,
        ...(page.before ? [{ _id: { $lt: new Types.ObjectId(page.before) } }] : [])] }).select('+history').sort({ _id: -1 }).limit(page.limit + 1);
      const selected = docs.slice(0, page.limit), items = [];
      for (const original of selected) {
        const doc = await this.expire(ctx, original);
        if (page.status && doc.status !== page.status) continue;
        if (inbox) {
          const decision = await this.decision(doc.professionalId.toHexString(), doc.capabilityId.toHexString());
          if (decision.status === 'unavailable') this.unavailable();
          if (decision.status !== 'eligible') continue;
          const target = decision.capability;
          if (target.professionalAuthUserId !== ctx.identity.id || target.capabilityId !== doc.capabilityId.toHexString()
            || target.professionalId !== doc.professionalId.toHexString() || target.relationshipKind !== doc.relationshipKind) this.unavailable();
        }
        items.push(this.dto(doc));
      }
      return { items, nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
    });
  }
  async command(ctx: RequestContext, id: string, action: 'accept' | 'decline' | 'cancel' | 'end', tag: string | undefined, key: string) {
    return this.audited(ctx, 'update', async () => {
      let doc = await this.expire(ctx, await this.owned(ctx, id));
      if (action === 'accept' || action === 'decline') {
        if (doc.professionalAuthUserId !== ctx.identity.id || ctx.identity.userType !== 'profissional') throw new ApiError(403, 'PROFESSIONAL_REQUIRED', 'Only the authorized recipient can resolve this request');
        await this.eligible({ professionalId: doc.professionalId.toHexString(), capabilityId: doc.capabilityId.toHexString(), relationshipKind: doc.relationshipKind }, ctx.identity.id);
      }
      if (action === 'cancel' && doc.subjectAuthUserId !== ctx.identity.id) throw new ApiError(403, 'REQUESTER_REQUIRED', 'Only the requester can cancel this request');
      const fingerprint = hash({ action, tag }), keyHash = hash(key);
      const replay = (current: RelationshipDoc) => {
        const event = current.history.find((event) => event.actorAuthUserId === ctx.identity.id && event.commandKeyHash === keyHash);
        if (!event) return false;
        if (event.commandFingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was used for a different command');
        return true;
      };
      if (replay(doc)) return { data: this.dto(doc), replayed: true };
      const from = action === 'end' ? 'accepted' : 'pending';
      if (doc.status !== from) throw new ApiError(409, doc.status === 'expired' ? 'RELATIONSHIP_EXPIRED' : 'INVALID_TRANSITION', 'This command is not valid for the current relationship state');
      if (expectedVersion(tag, id) !== doc.version) this.conflict(); this.historyLimit(doc);
      const to: RelationshipState = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : action === 'cancel' ? 'cancelled' : 'ended';
      const event = this.event(ctx, doc.version + 1, action, from, to, ctx.identity.id === doc.subjectAuthUserId ? 'requester' : 'professional', key, fingerprint);
      const now = this.now();
      const updated = await this.models.Relationship.findOneAndUpdate({ _id: doc._id, version: doc.version, status: from, 'history.7': { $exists: false },
        ...(from === 'pending' ? { expiresAt: { $gt: now }, $expr: { $gt: ['$expiresAt', '$$NOW'] } } : {}) },
      { $set: { status: to, version: doc.version + 1, isOpen: to === 'accepted', updatedAt: event.occurredAt,
        ...(to === 'accepted' ? { acceptedAt: event.occurredAt } : { closedAt: event.occurredAt }) }, $push: { history: event } },
      { returnDocument: 'after', runValidators: true, timestamps: false }).select('+history');
      if (updated) return { data: this.dto(updated), replayed: false };
      doc = await this.expire(ctx, await this.owned(ctx, id));
      if (replay(doc)) return { data: this.dto(doc), replayed: true };
      if (doc.status === 'expired') throw new ApiError(409, 'RELATIONSHIP_EXPIRED', 'Request has expired');
      this.conflict();
    }, id);
  }
  async eligibleCapabilities(ctx: RequestContext, page: PageOptions) {
    return this.audited(ctx, 'read', async () => {
      let result;
      try { result = await this.eligibility.list(page); } catch { return this.unavailable(); }
      if (!result || !Array.isArray(result.items) || result.items.length > page.limit
        || (result.nextBefore !== null && !isId(result.nextBefore))) this.unavailable();
      const items = [];
      for (const proposed of result.items) {
        if (!isId(proposed.professionalId) || !isId(proposed.capabilityId)) this.unavailable();
        const decision = await this.decision(proposed.professionalId, proposed.capabilityId);
        if (decision.status === 'unavailable') this.unavailable();
        if (decision.status !== 'eligible') continue;
        const target = this.target(proposed, decision.capability);
        if (target.professionalAuthUserId === ctx.identity.id) continue;
        items.push({ professionalId: target.professionalId, capabilityId: target.capabilityId,
          relationshipKind: target.relationshipKind, professionalName: target.professionalName });
      }
      return { items, nextBefore: result.nextBefore };
    });
  }
}
