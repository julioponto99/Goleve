import { createHash, randomUUID } from 'node:crypto';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { ProfessionalSettings } from '../config/settings';
import { expectedVersion, PageOptions } from '../config/http';
import { SubmissionInput } from '../config/application-validation';
import { ProfessionalModels } from '../models';
import { ApplicationAction, ApplicationData, ApplicationEvent, ApplicationSnapshot, ApplicationState } from '../models/professional-application.model';
import { RequestContext } from './professional.service';
import { acquireDraftLock, releaseDraftLock } from './draft-lock.service';
type ApplicationDoc = HydratedDocument<ApplicationData>;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function requireReviewer(ctx: RequestContext, settings: ProfessionalSettings): void {
  const ids = settings.reviewerIds;
  if (settings.dataMode !== 'synthetic' || settings.reviewMode !== 'synthetic' || !Array.isArray(ids) || !ids.length || ids.length > 50
    || ids.some((id) => typeof id !== 'string' || !/^[a-f0-9]{24}$/.test(id)) || new Set(ids).size !== ids.length
    || ctx.identity.userType !== 'administrador' || !ids.includes(ctx.identity.id)) {
    throw new ApiError(403, 'ADMIN_REVIEW_FORBIDDEN', 'Administrative review is not authorized');
  }
}
export class ApplicationService {
  constructor(public readonly models: ProfessionalModels, private readonly settings: ProfessionalSettings) {}
  private notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Application not found'); }
  private conflict(): never { throw new ApiError(412, 'VERSION_CONFLICT', 'Application changed; read the current version'); }
  private async audit(ctx: RequestContext, action: 'read' | 'update', decision: 'intent' | 'allowed' | 'failed', id?: string) {
    try { await this.models.Audit.create({ eventId: randomUUID(), requestId: ctx.requestId, actorId: ctx.identity.id,
      purposeCode: 'synthetic_application_review', resourceType: 'application', actionCode: action, decision,
      resourceOpaqueId: id, occurredAt: new Date(), dataMode: 'synthetic' }); }
    catch { throw new ApiError(503, 'AUDIT_UNAVAILABLE', 'Application auditing is unavailable'); }
  }
  private async audited<T>(ctx: RequestContext, action: 'read' | 'update', work: () => Promise<T>, id?: string): Promise<T> {
    await this.audit(ctx, action, 'intent', id);
    try { const result = await work(); await this.audit(ctx, action, 'allowed', id); return result; }
    catch (error) { try { await this.audit(ctx, action, 'failed', id); } catch { console.error('professional-service application audit completion unavailable'); } throw error; }
  }
  private statusDto(doc: ApplicationDoc, reviewer = false) {
    return { id: doc._id.toHexString(), professionalId: doc.professionalId.toHexString(), status: doc.status, version: doc.version,
      submittedAt: doc.submittedAt, updatedAt: doc.updatedAt, approvalType: 'simulated', professionalPrivileges: false,
      publicationEnabled: doc.publicationEnabled,
      ...(doc.lastDecision ? { lastDecision: { action: doc.lastDecision.action, occurredAt: doc.lastDecision.occurredAt,
        ...(doc.lastDecision.reason ? { reason: doc.lastDecision.reason } : {}),
        ...(reviewer ? { actorAuthUserId: doc.lastDecision.actorAuthUserId } : {}) } } : {}) };
  }
  private replay(doc: ApplicationDoc, ctx: RequestContext, key: string, fingerprint: string) {
    const previous = doc.history.find((event) => event.actorAuthUserId === ctx.identity.id && event.commandKeyHash === hash(key));
    if (!previous) return false;
    if (previous.commandFingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was used for a different command');
    return true;
  }
  private event(ctx: RequestContext, action: ApplicationAction, from: ApplicationState, to: ApplicationState, version: number,
    key: string, fingerprint: string, reason?: string): ApplicationEvent {
    return { eventId: randomUUID(), version, action, from, to, actorAuthUserId: ctx.identity.id,
      occurredAt: new Date(), commandKeyHash: hash(key), commandFingerprint: fingerprint, ...(reason ? { reason } : {}) };
  }
  private async current(owner: string) {
    return this.models.Application.findOne({ authUserId: owner }).select('+snapshot +history');
  }
  async ownStatus(ctx: RequestContext) {
    return this.audited(ctx, 'read', async () => {
      const doc = await this.current(ctx.identity.id);
      if (doc) return this.statusDto(doc);
      const profile = await this.models.Profile.findOne({ authUserId: ctx.identity.id });
      if (!profile) this.notFound();
      return { id: profile._id.toHexString(), professionalId: profile._id.toHexString(), status: 'draft', version: profile.version,
        approvalType: 'simulated', professionalPrivileges: false, publicationEnabled: false };
    });
  }
  private async snapshot(owner: string, profileId: Types.ObjectId, version: number, input: SubmissionInput): Promise<ApplicationSnapshot> {
    const [profile, capabilities, qualifications] = await Promise.all([
      this.models.Profile.findOne({ _id: profileId, authUserId: owner }),
      this.models.Capability.find({ professionalId: profileId, authUserId: owner }).sort({ _id: 1 }).limit(21),
      this.models.Qualification.find({ professionalId: profileId, authUserId: owner }).sort({ _id: 1 }).limit(51),
    ]);
    if (!profile || !capabilities.length || capabilities.length > 20 || !qualifications.length || qualifications.length > 50
      || capabilities.some((cap) => cap.status !== 'draft' || !qualifications.some((q) => q.capabilityId?.equals(cap._id)))
      || qualifications.some((q) => q.verificationStatus !== 'unverified' || (q.capabilityId && !capabilities.some((c) => c._id.equals(q.capabilityId!))))) {
      throw new ApiError(400, 'APPLICATION_INCOMPLETE', 'Submit one to twenty draft activities, each with a declared qualification; at most fifty qualifications');
    }
    if (input.publicQualificationIds.some((id) => !qualifications.some((q) => q._id.toHexString() === id))) throw new ApiError(400, 'VALIDATION_ERROR', 'Public qualifications must belong to this application');
    return { profile: { professionalName: profile.professionalName, countryCode: profile.countryCode, languages: [...profile.languages],
      ...(profile.biography ? { biography: profile.biography } : {}) },
      capabilities: capabilities.map((c) => ({ id: c._id.toHexString(), kind: c.kind, jurisdictionCountry: c.jurisdictionCountry,
        specializations: [...c.specializations], serviceModes: [...c.serviceModes], ...(c.experienceStartYear !== undefined ? { experienceStartYear: c.experienceStartYear } : {}) })),
      qualifications: qualifications.map((q) => ({ id: q._id.toHexString(), ...(q.capabilityId ? { capabilityId: q.capabilityId.toHexString() } : {}),
        qualificationType: q.qualificationType, title: q.title, issuerName: q.issuerName,
        ...(q.awardedOn ? { awardedOn: q.awardedOn } : {}), ...(q.expiresOn ? { expiresOn: q.expiresOn } : {}) })),
      publicationRequested: input.publicationRequested, publicQualificationIds: [...input.publicQualificationIds], submittedProfileVersion: version };
  }
  async submit(ctx: RequestContext, input: SubmissionInput, tag: string | undefined, key: string) {
    return this.audited(ctx, 'update', async () => {
      const token = await acquireDraftLock(this.models, ctx.identity.id);
      try {
        const fingerprint = hash({ action: 'submit', input, tag }); const existing = await this.current(ctx.identity.id);
        if (existing && this.replay(existing, ctx, key, fingerprint)) return { data: this.statusDto(existing), replayed: true };
        if (existing && existing.status !== 'draft') throw new ApiError(409, 'INVALID_TRANSITION', 'Only draft applications can be submitted');
        const profile = await this.models.Profile.findOne({ authUserId: ctx.identity.id }); if (!profile) this.notFound();
        if (expectedVersion(tag, profile._id.toHexString()) !== profile.version) this.conflict();
        const snapshot = await this.snapshot(ctx.identity.id, profile._id, profile.version, input);
        const version = existing ? existing.version + 1 : 1, event = this.event(ctx, 'submit', 'draft', 'pending', version, key, fingerprint);
        let result: ApplicationDoc | null;
        if (!existing) result = await this.models.Application.create({ authUserId: ctx.identity.id, professionalId: profile._id,
          version, status: 'pending', snapshot, history: [event], publicationEnabled: false, submittedAt: event.occurredAt });
        else {
          this.historyLimit(existing);
          result = await this.models.Application.findOneAndUpdate({ _id: existing._id, version: existing.version, status: 'draft' },
            { $set: { status: 'pending', snapshot, submittedAt: event.occurredAt, publicationEnabled: false, version }, $push: { history: event } },
            { returnDocument: 'after', runValidators: true });
        }
        if (!result) this.conflict(); return { data: this.statusDto(result), replayed: false };
      } finally { await releaseDraftLock(this.models, ctx.identity.id, token, false); }
    });
  }
  private historyLimit(doc: ApplicationDoc, suspension = false) {
    // Reserve the final slot so a published approval can always be suspended.
    if (doc.history.length >= (suspension ? 50 : 49)) throw new ApiError(409, 'APPLICATION_HISTORY_LIMIT', 'Application requires controlled archival before further transitions');
  }
  async reopen(ctx: RequestContext, tag: string | undefined, key: string) {
    return this.audited(ctx, 'update', async () => {
      const token = await acquireDraftLock(this.models, ctx.identity.id);
      try {
        const doc = await this.current(ctx.identity.id); if (!doc) this.notFound();
        const fingerprint = hash({ action: 'reopen', tag });
        if (this.replay(doc, ctx, key, fingerprint)) return { data: this.statusDto(doc), replayed: true };
        if (doc.status !== 'rejected') throw new ApiError(409, 'INVALID_TRANSITION', 'Only rejected applications can be reopened');
        if (expectedVersion(tag, doc._id.toHexString()) !== doc.version) this.conflict(); this.historyLimit(doc);
        const event = this.event(ctx, 'reopen', 'rejected', 'draft', doc.version + 1, key, fingerprint);
        const updated = await this.models.Application.findOneAndUpdate({ _id: doc._id, authUserId: ctx.identity.id, version: doc.version, status: 'rejected' },
          { $set: { status: 'draft', version: doc.version + 1, publicationEnabled: false }, $push: { history: event } }, { returnDocument: 'after', runValidators: true });
        if (!updated) this.conflict(); return { data: this.statusDto(updated), replayed: false };
      } finally { await releaseDraftLock(this.models, ctx.identity.id, token, false); }
    });
  }
  private async reviewed(ctx: RequestContext, id: string) {
    requireReviewer(ctx, this.settings);
    const doc = await this.models.Application.findById(id).select('+snapshot +history'); if (!doc) this.notFound();
    if (doc.authUserId === ctx.identity.id) throw new ApiError(403, 'SELF_REVIEW_FORBIDDEN', 'Candidates cannot review their own application');
    return doc;
  }
  async list(ctx: RequestContext, page: PageOptions & { status: ApplicationState }) {
    requireReviewer(ctx, this.settings);
    return this.audited(ctx, 'read', async () => {
      const docs = await this.models.Application.find({ authUserId: { $ne: ctx.identity.id }, status: page.status,
        ...(page.before ? { _id: { $lt: new Types.ObjectId(page.before) } } : {}) }).sort({ _id: -1 }).limit(page.limit + 1);
      const selected = docs.slice(0, page.limit);
      return { items: selected.map((doc) => this.statusDto(doc, true)), nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
    });
  }
  async detail(ctx: RequestContext, id: string) {
    requireReviewer(ctx, this.settings);
    return this.audited(ctx, 'read', async () => { const doc = await this.reviewed(ctx, id);
      return { ...this.statusDto(doc, true), submittedData: doc.snapshot }; }, id);
  }
  async history(ctx: RequestContext, id: string) {
    requireReviewer(ctx, this.settings);
    return this.audited(ctx, 'read', async () => { const doc = await this.reviewed(ctx, id);
      return { id: doc._id.toHexString(), version: doc.version, items: doc.history.map((event) => ({ eventId: event.eventId,
        version: event.version, action: event.action, from: event.from, to: event.to, actorAuthUserId: event.actorAuthUserId,
        occurredAt: event.occurredAt, ...(event.reason ? { reason: event.reason } : {}) })) }; }, id);
  }
  async decide(ctx: RequestContext, id: string, action: 'approve' | 'reject' | 'suspend', input: { publish?: boolean; reason?: string }, tag: string | undefined, key: string) {
    requireReviewer(ctx, this.settings);
    return this.audited(ctx, 'update', async () => {
      const doc = await this.reviewed(ctx, id), fingerprint = hash({ action, input, tag });
      if (this.replay(doc, ctx, key, fingerprint)) return { data: this.statusDto(doc, true), replayed: true };
      const from = action === 'suspend' ? 'approved' : 'pending', to = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
      if (doc.status !== from) throw new ApiError(409, 'INVALID_TRANSITION', 'This decision is not valid for the current application state');
      if (expectedVersion(tag, doc._id.toHexString()) !== doc.version) this.conflict(); this.historyLimit(doc, action === 'suspend');
      if (action === 'approve' && input.publish && !doc.snapshot.publicationRequested) throw new ApiError(400, 'PUBLICATION_NOT_REQUESTED', 'Candidate did not request publication');
      const event = this.event(ctx, action, from, to, doc.version + 1, key, fingerprint, input.reason);
      const updated = await this.models.Application.findOneAndUpdate({ _id: doc._id, version: doc.version, status: from },
        { $set: { status: to, version: doc.version + 1, publicationEnabled: action === 'approve' && input.publish === true,
          lastDecision: { action, actorAuthUserId: ctx.identity.id, occurredAt: event.occurredAt, ...(input.reason ? { reason: input.reason } : {}) } },
          $push: { history: event } }, { returnDocument: 'after', runValidators: true });
      if (!updated) {
        const latest = await this.reviewed(ctx, id);
        if (this.replay(latest, ctx, key, fingerprint)) return { data: this.statusDto(latest, true), replayed: true };
        this.conflict();
      }
      return { data: this.statusDto(updated, true), replayed: false };
    }, id);
  }
  async catalog(page: PageOptions) {
    const docs = await this.models.Application.find({ status: 'approved', publicationEnabled: true, dataMode: 'synthetic',
      ...(page.before ? { _id: { $lt: new Types.ObjectId(page.before) } } : {}) }).select('+snapshot').sort({ _id: -1 }).limit(page.limit + 1);
    const selected = docs.slice(0, page.limit);
    return { items: selected.map((doc) => ({ id: doc.professionalId.toHexString(), professionalName: doc.snapshot.profile.professionalName,
      ...(doc.snapshot.profile.biography ? { biography: doc.snapshot.profile.biography } : {}), approvalType: 'simulated', professionalPrivileges: false,
      capabilities: doc.snapshot.capabilities.map((c) => ({ kind: c.kind, specializations: [...c.specializations], serviceModes: [...c.serviceModes] })),
      qualifications: doc.snapshot.qualifications.filter((q) => doc.snapshot.publicQualificationIds.includes(q.id))
        .map((q) => ({ qualificationType: q.qualificationType, title: q.title })) })),
      nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
  }
}
