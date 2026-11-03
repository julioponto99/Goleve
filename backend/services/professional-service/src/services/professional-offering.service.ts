import { localDemo } from '../local-demo';
import { fixtureEligible } from '../local-demo-fixtures';
import { HydratedDocument, Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { expectedVersion, PageOptions } from '../config/http';
import { JsonObject, mergeFields } from '../config/validation';
import { ProfessionalModels } from '../models';
import { ProfessionalServiceData } from '../models/professional-service.model';
import { RequestContext } from './professional.service';

type Offering = HydratedDocument<ProfessionalServiceData>;
const fields = ['name', 'description', 'priceEur', 'durationMinutes', 'bufferBeforeMinutes', 'bufferAfterMinutes'] as const;
const dto = (doc: Offering) => ({
  id: doc._id.toHexString(), professionalId: doc.professionalId.toHexString(), capabilityId: doc.capabilityId.toHexString(),
  category: doc.category, name: doc.name, description: doc.description, priceEur: doc.priceEur,
  durationMinutes: doc.durationMinutes, bufferBeforeMinutes: doc.bufferBeforeMinutes, bufferAfterMinutes: doc.bufferAfterMinutes,
  active: doc.active, version: doc.version, createdAt: doc.createdAt, updatedAt: doc.updatedAt,
});
const publicDto = (doc: Offering) => ({ ...dto(doc) });

export interface PublicServiceQuery extends PageOptions { category?: string; q?: string; capabilityId?: string }
export class ProfessionalOfferingService {
  constructor(private readonly models: ProfessionalModels) {}
  private notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Service not found'); }
  private async owned(ctx: RequestContext, id: string) {
    const doc = await this.models.Service.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!doc) this.notFound();
    return doc;
  }
  private async capability(ctx: RequestContext, id: string) {
    const capability = await this.models.Capability.findOne({ _id: id, authUserId: ctx.identity.id });
    if (!capability) throw new ApiError(404, 'CAPABILITY_NOT_FOUND', 'Capability not found');
    return capability;
  }
  async create(ctx: RequestContext, input: JsonObject) {
    const capability = await this.capability(ctx, String(input.capabilityId));
    if (input.category !== capability.kind) throw new ApiError(400, 'SERVICE_CATEGORY_MISMATCH', 'Service category must match the capability');
    const doc = await this.models.Service.create({
      ...input, authUserId: ctx.identity.id, professionalId: capability.professionalId,
      capabilityId: capability._id, active: true,
    });
    return dto(doc);
  }
  async listMine(ctx: RequestContext, page: PageOptions) {
    const docs = await this.models.Service.find({ authUserId: ctx.identity.id, ...(page.before ? { _id: { $lt: new Types.ObjectId(page.before) } } : {}) })
      .sort({ _id: -1 }).limit(page.limit + 1);
    const selected = docs.slice(0, page.limit);
    return { items: selected.map(dto), nextBefore: docs.length > page.limit ? selected.at(-1)!._id.toHexString() : null };
  }
  async get(ctx: RequestContext, id: string) { return dto(await this.owned(ctx, id)); }
  async update(ctx: RequestContext, id: string, input: JsonObject, tag?: string) {
    const current = await this.owned(ctx, id);
    const version = expectedVersion(tag, id);
    const updated = await this.models.Service.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, version }, {
      $set: { ...mergeFields(Object.fromEntries(fields.map((field) => [field, current[field]])), input), version: version + 1 },
    }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw new ApiError(412, 'VERSION_CONFLICT', 'Resource version does not match');
    return dto(updated);
  }
  async deactivate(ctx: RequestContext, id: string, tag?: string) {
    const version = expectedVersion(tag, id);
    const updated = await this.models.Service.findOneAndUpdate({ _id: id, authUserId: ctx.identity.id, version, active: true },
      { $set: { active: false, version: version + 1 } }, { returnDocument: 'after' });
    if (!updated) throw new ApiError(412, 'VERSION_CONFLICT', 'Service is already inactive or changed');
    return dto(updated);
  }
  async publicCatalog(query: PublicServiceQuery) {
    if(localDemo.policy()){const filter:any={active:true,...(query.before?{_id:{$lt:query.before}}:{}),...(query.category?{category:query.category}:{}),...(query.capabilityId?{capabilityId:query.capabilityId}:{} )};if(query.q)filter.name={$regex:query.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};const docs=await this.models.Service.find(filter).sort({_id:-1}).limit(query.limit+1),items:any[]=[];for(const doc of docs){const profile=await this.models.Profile.findById(doc.professionalId),cap=await this.models.Capability.findById(doc.capabilityId);if(await fixtureEligible(this.models,profile,cap,doc))items.push({...publicDto(doc),authority:'synthetic',demonstration:true});}return{items:items.slice(0,query.limit),nextBefore:docs.length>query.limit?String(docs[query.limit-1]._id):null};}
    const applications = await this.models.Application.find({ status: 'approved', publicationEnabled: true }).select('professionalId');
    const visible=await this.models.Profile.find({_id:{$in:applications.map(a=>a.professionalId)},profileStatus:{$nin:['suspended','archived']},administrativelySuspended:{$ne:true}}).select('_id');
    const professionalIds = visible.map(p=>p._id);
    if (!professionalIds.length) return { items: [], nextBefore: null };
    const filter: Record<string, unknown> = { professionalId: { $in: professionalIds }, active: true };
    if (query.category) filter.category = query.category;
    if (query.capabilityId) filter.capabilityId = query.capabilityId;
    if (query.q) {
      const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { description: { $regex: escaped, $options: 'i' } }];
    }
    if (query.before) filter._id = { $lt: new Types.ObjectId(query.before) };
    const docs = await this.models.Service.find(filter).sort({ _id: -1 }).limit(query.limit + 1);
    const selected = docs.slice(0, query.limit);
    return { items: selected.map(publicDto), nextBefore: docs.length > query.limit ? selected.at(-1)!._id.toHexString() : null };
  }
}
