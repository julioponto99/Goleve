import { NextFunction, Request, Response } from 'express';
import { entityTag, pageOptions } from '../config/http';
import { objectId } from '../config/validation';
import { validateService } from '../config/service-validation';
import { ProfessionalOfferingService } from '../services/professional-offering.service';
import { RequestContext } from '../services/professional.service';

function publicPage(query: unknown) {
  const data = query as Record<string, unknown>;
  const page = pageOptions({ limit: data.limit, before: data.before });
  const category = data.category === undefined ? undefined : String(data.category);
  const q = data.q === undefined ? undefined : String(data.q).trim();
  const capabilityId = data.capabilityId === undefined ? undefined : objectId(data.capabilityId);
  if (category && !['personal_trainer', 'nutritionist'].includes(category)) throw new Error('Invalid service category');
  if (q !== undefined && (q.length < 1 || q.length > 100)) throw new Error('Invalid service search');
  return { ...page, ...(category ? { category } : {}), ...(q ? { q } : {}), ...(capabilityId ? { capabilityId } : {}) };
}
export function createProfessionalOfferingController(service: ProfessionalOfferingService) {
  const context = (res: Response) => res.locals.context as RequestContext;
  const send = (res: Response, data: unknown, status = 200) => {
    if (data && typeof data === 'object' && 'id' in data && 'version' in data) res.set('ETag', entityTag(String(data.id), Number(data.version)));
    res.status(status).json({ data });
  };
  const handle = (work: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => { work(req, res).catch(next); };
  return {
    create: handle(async (req, res) => send(res, await service.create(context(res), validateService(req.body)), 201)),
    listMine: handle(async (req, res) => send(res, await service.listMine(context(res), pageOptions(req.query)))),
    get: handle(async (req, res) => send(res, await service.get(context(res), objectId(req.params.serviceId)))),
    update: handle(async (req, res) => send(res, await service.update(context(res), objectId(req.params.serviceId), validateService(req.body, true), req.get('if-match')))),
    deactivate: handle(async (req, res) => send(res, await service.deactivate(context(res), objectId(req.params.serviceId), req.get('if-match')))),
    publicCatalog: handle(async (req, res) => send(res, await service.publicCatalog(publicPage(req.query)))),
  };
}
