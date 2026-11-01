import { createHash, randomUUID } from 'node:crypto';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { CATALOG_VERSION } from '../config/catalog';
import { expectedVersion, PageOptions } from '../config/http';
import { AVAILABILITY_FIELDS, CAPABILITY_FIELDS, CAPABILITY_MUTABLE_FIELDS, JsonObject, mergeFields,
  PROFILE_FIELDS, QUALIFICATION_FIELDS, QUALIFICATION_MUTABLE_FIELDS, validateAvailabilityConsistency,
  validateCapabilityConsistency, validateQualificationConsistency } from '../config/validation';
import { ProfessionalModels } from '../models';
import { OwnedData } from '../models/common';
import { ProfileData } from '../models/professional-profile.model';
import { CapabilityData } from '../models/professional-capability.model';
import { QualificationData } from '../models/professional-qualification.model';
import { AvailabilityData } from '../models/availability-declaration.model';
export interface RequestContext { identity: { id: string; userType: string }; requestId: string }
type Resource = 'profile' | 'capability' | 'qualification' | 'availability';
type Action = 'read' | 'create' | 'update';
function pick(value: object, fields: readonly string[]): JsonObject {
  const data = value as JsonObject;
  return Object.fromEntries(fields.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
}
function metadata<T extends OwnedData>(doc: HydratedDocument<T>) {
  return { id: doc._id.toHexString(), authUserId: doc.authUserId, schemaVersion: doc.schemaVersion,
    version: doc.version, createdAt: doc.createdAt, updatedAt: doc.updatedAt, dataMode: 'synthetic' };
}
function duplicate(error: unknown): boolean { return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000); }
export class ProfessionalService {
  constructor(public readonly models: ProfessionalModels) {}
  private async audit(ctx: RequestContext, resourceType: Resource, actionCode: Action, decision: 'intent' | 'allowed' | 'failed', result?: { id?: string; version?: number }) {
    try { await this.models.Audit.create({ eventId: randomUUID(), requestId: ctx.requestId, actorId: ctx.identity.id,
      purposeCode: 'synthetic_self_application', resourceType, actionCode, decision,
      resourceOpaqueId: result?.id, resourceVersion: result?.version, occurredAt: new Date(), dataMode: 'synthetic' }); }
    catch { throw new ApiError(503, 'AUDIT_UNAVAILABLE', 'Professional data auditing is unavailable'); }
  }
  private async operation<T>(ctx: RequestContext, type: Resource, action: Action, work: () => Promise<T>): Promise<T> {
    await this.audit(ctx, type, action, 'intent');
    try {
      const result = await work();
      const resource = result && typeof result === 'object' ? result as { id?: string; version?: number } : undefined;
      await this.audit(ctx, type, action, 'allowed', resource); return result;
    } catch (error) {
      try { await this.audit(ctx, type, action, 'failed'); } catch { console.error('professional-service audit completion unavailable'); }
      throw error;
    }
  }
  private notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Resource not found'); }
  private conflict(): never { throw new ApiError(412, 'VERSION_CONFLICT', 'Resource changed; read the current version'); }
  private async profile(owner: string, editing = false) {
    const doc = await this.models.Profile.findOne({ authUserId: owner });
    if (!doc) throw new ApiError(404, 'PROFILE_REQUIRED', 'Create your professional draft profile first');
    if (editing && doc.profileStatus !== 'draft') throw new ApiError(403, 'APPLICATION_NOT_EDITABLE', 'Only draft applications can be edited in this phase');
    return doc;
  }
  private profileDto(doc: HydratedDocument<ProfileData>) {
    return { ...metadata(doc), ...pick(doc.toObject(), PROFILE_FIELDS), profileStatus: doc.profileStatus,
      directoryVisibility: doc.directoryVisibility, publicationVersion: doc.publicationVersion,
      contactsPublicationStatus: 'unpublished', professionalPrivileges: false };
  }
  private capabilityDto(doc: HydratedDocument<CapabilityData>) {
    return { ...metadata(doc), professionalId: doc.professionalId.toHexString(), ...pick(doc.toObject(), CAPABILITY_FIELDS),
      status: doc.status, titleRequirement: doc.titleRequirement, requirementPolicyVersion: doc.requirementPolicyVersion,
      catalogVersion: CATALOG_VERSION, experienceVerificationStatus: 'self_declared', eligibleForProfessionalActions: false };
  }
  private qualificationDto(doc: HydratedDocument<QualificationData>) {
    const data = pick(doc.toObject(), QUALIFICATION_FIELDS.filter((key) => key !== 'capabilityId'));
    return { ...metadata(doc), professionalId: doc.professionalId.toHexString(), ...data,
      ...(doc.capabilityId ? { capabilityId: doc.capabilityId.toHexString() } : {}),
      verificationStatus: doc.verificationStatus, publishSummary: doc.publishSummary, catalogVersion: CATALOG_VERSION };
  }
  private availabilityDto(doc: HydratedDocument<AvailabilityData>) {
    return { ...metadata(doc), professionalId: doc.professionalId.toHexString(), ...pick(doc.toObject(), AVAILABILITY_FIELDS),
      visibility: 'private', operational: false, purpose: 'application_preferences' };
  }
  async getProfile(ctx: RequestContext) {
    return this.operation(ctx, 'profile', 'read', async () => this.profileDto(await this.profile(ctx.identity.id)));
  }
  async createProfile(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'profile', 'create', async () => {
      try { return this.profileDto(await this.models.Profile.create({ ...mergeFields({}, input), authUserId: ctx.identity.id,
        profileStatus: 'draft', directoryVisibility: 'hidden', publicationVersion: 0 })); }
      catch (error) { if (duplicate(error)) this.conflict(); throw error; }
    });
  }
  async updateProfile(ctx: RequestContext, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'profile', 'update', async () => {
      const current = await this.profile(ctx.identity.id, true), version = expectedVersion(tag, current._id.toHexString());
      const updated = await this.models.Profile.findOneAndUpdate({ _id: current._id, authUserId: ctx.identity.id, version, profileStatus: 'draft' },
        this.update(pick(current.toObject(), PROFILE_FIELDS), patch, PROFILE_FIELDS, version), { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict(); return this.profileDto(updated);
    });
  }
  private update(current: JsonObject, patch: JsonObject, fields: readonly string[], version: number) {
    const data = mergeFields(current, patch);
    const unset = Object.fromEntries(fields.filter((key) => !(key in data)).map((key) => [key, '']));
    return { $set: { ...data, version: version + 1 }, ...(Object.keys(unset).length ? { $unset: unset } : {}) };
  }
  private async ownCapability(owner: string, profileId: Types.ObjectId, id: string) {
    const doc = await this.models.Capability.findOne({ _id: id, authUserId: owner, professionalId: profileId });
    if (!doc) this.notFound(); return doc;
  }
  async createCapability(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'capability', 'create', async () => {
      const profile = await this.profile(ctx.identity.id, true); validateCapabilityConsistency(input);
      try { return this.capabilityDto(await this.models.Capability.create({ ...mergeFields({}, input), professionalId: profile._id,
        authUserId: ctx.identity.id, status: 'draft', titleRequirement: 'pending_legal_assessment', requirementPolicyVersion: 'synthetic-unassessed-v1' })); }
      catch (error) { if (duplicate(error)) throw new ApiError(409, 'CAPABILITY_EXISTS', 'This activity and jurisdiction already exist in your application'); throw error; }
    });
  }
  async getCapability(ctx: RequestContext, id: string) {
    return this.operation(ctx, 'capability', 'read', async () => {
      const profile = await this.profile(ctx.identity.id);
      return this.capabilityDto(await this.ownCapability(ctx.identity.id, profile._id, id));
    });
  }
  async updateCapability(ctx: RequestContext, id: string, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'capability', 'update', async () => {
      const profile = await this.profile(ctx.identity.id, true), current = await this.ownCapability(ctx.identity.id, profile._id, id);
      if (current.status !== 'draft') throw new ApiError(403, 'CAPABILITY_NOT_EDITABLE', 'Only draft capabilities can be edited in this phase');
      const version = expectedVersion(tag, id);
      validateCapabilityConsistency(mergeFields(pick(current.toObject(), CAPABILITY_FIELDS), patch));
      const updated = await this.models.Capability.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, professionalId: profile._id, version, status: 'draft' },
        this.update(pick(current.toObject(), CAPABILITY_MUTABLE_FIELDS), patch, CAPABILITY_MUTABLE_FIELDS, version), { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict(); return this.capabilityDto(updated);
    });
  }
  async listCapabilities(ctx: RequestContext, page: PageOptions) {
    return this.operation(ctx, 'capability', 'read', async () => {
      const profile = await this.profile(ctx.identity.id);
      const docs = await this.models.Capability.find({ authUserId: ctx.identity.id, professionalId: profile._id,
        ...(page.before ? { _id: { $lt: new Types.ObjectId(page.before) } } : {}) }).sort({ _id: -1 }).limit(page.limit + 1);
      const selected = docs.slice(0, page.limit);
      return { items: selected.map((doc) => this.capabilityDto(doc)), nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
    });
  }
  private async qualificationKind(owner: string, profileId: Types.ObjectId, data: JsonObject) {
    const capability = data.capabilityId ? await this.ownCapability(owner, profileId, String(data.capabilityId)) : undefined;
    validateQualificationConsistency(data, capability?.kind);
  }
  async createQualification(ctx: RequestContext, input: JsonObject, key: string) {
    return this.operation(ctx, 'qualification', 'create', async () => {
      const profile = await this.profile(ctx.identity.id, true);
      await this.qualificationKind(ctx.identity.id, profile._id, input);
      const fingerprint = createHash('sha256').update(JSON.stringify({ owner: ctx.identity.id, ...input })).digest('hex');
      const existing = () => this.models.Qualification.findOne({ authUserId: ctx.identity.id, professionalId: profile._id, idempotencyKey: key }).select('+inputFingerprint');
      const replay = (doc: HydratedDocument<QualificationData> & { inputFingerprint?: string }) => {
        if (doc.inputFingerprint !== fingerprint) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was used for different data');
        return { data: this.qualificationDto(doc), replayed: true };
      };
      const previous = await existing(); if (previous) return replay(previous);
      try {
        const doc = await this.models.Qualification.create({ ...mergeFields({}, input), authUserId: ctx.identity.id, professionalId: profile._id,
          verificationStatus: 'unverified', publishSummary: false, idempotencyKey: key, inputFingerprint: fingerprint });
        return { data: this.qualificationDto(doc), replayed: false };
      } catch (error) { if (duplicate(error)) { const doc = await existing(); if (doc) return replay(doc); } throw error; }
    });
  }
  async getQualification(ctx: RequestContext, id: string) {
    return this.operation(ctx, 'qualification', 'read', async () => {
      const profile = await this.profile(ctx.identity.id);
      const doc = await this.models.Qualification.findOne({ _id: id, authUserId: ctx.identity.id, professionalId: profile._id });
      if (!doc) this.notFound(); return this.qualificationDto(doc);
    });
  }
  async updateQualification(ctx: RequestContext, id: string, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'qualification', 'update', async () => {
      const profile = await this.profile(ctx.identity.id, true);
      const current = await this.models.Qualification.findOne({ _id: id, authUserId: ctx.identity.id, professionalId: profile._id });
      if (!current) this.notFound();
      if (current.verificationStatus !== 'unverified' || current.publishSummary) throw new ApiError(403, 'QUALIFICATION_NOT_EDITABLE', 'Only unpublished unverified qualifications can be edited in this phase');
      const version = expectedVersion(tag, id), data = mergeFields(pick(current.toObject(), QUALIFICATION_MUTABLE_FIELDS), patch);
      await this.qualificationKind(ctx.identity.id, profile._id, { ...data, capabilityId: current.capabilityId?.toHexString() });
      const updated = await this.models.Qualification.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, professionalId: profile._id,
        version, verificationStatus: 'unverified', publishSummary: false },
      this.update(pick(current.toObject(), QUALIFICATION_MUTABLE_FIELDS), patch, QUALIFICATION_MUTABLE_FIELDS, version), { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict(); return this.qualificationDto(updated);
    });
  }
  async listQualifications(ctx: RequestContext, page: PageOptions) {
    return this.operation(ctx, 'qualification', 'read', async () => {
      const profile = await this.profile(ctx.identity.id);
      const docs = await this.models.Qualification.find({ authUserId: ctx.identity.id, professionalId: profile._id,
        ...(page.before ? { _id: { $lt: new Types.ObjectId(page.before) } } : {}) }).sort({ _id: -1 }).limit(page.limit + 1);
      const selected = docs.slice(0, page.limit);
      return { items: selected.map((doc) => this.qualificationDto(doc)), nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
    });
  }
  async getAvailability(ctx: RequestContext) {
    return this.operation(ctx, 'availability', 'read', async () => {
      const profile = await this.profile(ctx.identity.id);
      const doc = await this.models.Availability.findOne({ authUserId: ctx.identity.id, professionalId: profile._id });
      if (!doc) this.notFound(); return this.availabilityDto(doc);
    });
  }
  async createAvailability(ctx: RequestContext, input: JsonObject) {
    return this.operation(ctx, 'availability', 'create', async () => {
      const profile = await this.profile(ctx.identity.id, true); validateAvailabilityConsistency(input);
      try { return this.availabilityDto(await this.models.Availability.create({ ...input, authUserId: ctx.identity.id,
        professionalId: profile._id, visibility: 'private', operational: false })); }
      catch (error) { if (duplicate(error)) this.conflict(); throw error; }
    });
  }
  async updateAvailability(ctx: RequestContext, patch: JsonObject, tag?: string) {
    return this.operation(ctx, 'availability', 'update', async () => {
      const profile = await this.profile(ctx.identity.id, true);
      const current = await this.models.Availability.findOne({ authUserId: ctx.identity.id, professionalId: profile._id });
      if (!current) this.notFound(); const version = expectedVersion(tag, current._id.toHexString());
      validateAvailabilityConsistency(mergeFields(pick(current.toObject(), AVAILABILITY_FIELDS), patch));
      const updated = await this.models.Availability.findOneAndUpdate({ _id: current._id, authUserId: ctx.identity.id, professionalId: profile._id, version },
        this.update(pick(current.toObject(), AVAILABILITY_FIELDS), patch, AVAILABILITY_FIELDS, version), { returnDocument: 'after', runValidators: true });
      if (!updated) this.conflict(); return this.availabilityDto(updated);
    });
  }
}
