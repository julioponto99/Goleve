import { NextFunction, Request, Response } from 'express';
import { ProfessionalService, RequestContext } from '../services/professional.service';
import { entityTag, idempotencyKey, pageOptions, requireCreate } from '../config/http';
import { objectId, validateAvailability, validateCapability, validateProfile, validateQualification } from '../config/validation';
export function createProfessionalController(service: ProfessionalService) {
  const context = (res: Response) => res.locals.context as RequestContext;
  const send = (res: Response, data: unknown, status = 200) => {
    if (data && typeof data === 'object' && 'id' in data && 'version' in data) res.set('ETag', entityTag(String(data.id), Number(data.version)));
    res.status(status).json({ data });
  };
  const handle = (work: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => { work(req, res).catch(next); };
  return {
    getProfile: handle(async (_req, res) => send(res, await service.getProfile(context(res)))),
    createProfile: handle(async (req, res) => {
      requireCreate(req.get('if-none-match')); send(res, await service.createProfile(context(res), validateProfile(req.body)), 201);
    }),
    updateProfile: handle(async (req, res) => send(res, await service.updateProfile(context(res), validateProfile(req.body, true), req.get('if-match')))),
    listCapabilities: handle(async (req, res) => send(res, await service.listCapabilities(context(res), pageOptions(req.query)))),
    createCapability: handle(async (req, res) => send(res, await service.createCapability(context(res), validateCapability(req.body)), 201)),
    getCapability: handle(async (req, res) => send(res, await service.getCapability(context(res), objectId(req.params.capabilityId)))),
    updateCapability: handle(async (req, res) => send(res, await service.updateCapability(context(res), objectId(req.params.capabilityId), validateCapability(req.body, true), req.get('if-match')))),
    listQualifications: handle(async (req, res) => send(res, await service.listQualifications(context(res), pageOptions(req.query)))),
    createQualification: handle(async (req, res) => {
      const result = await service.createQualification(context(res), validateQualification(req.body), idempotencyKey(req.get('idempotency-key')));
      if (result.replayed) res.set('Idempotency-Replayed', 'true'); send(res, result.data, result.replayed ? 200 : 201);
    }),
    getQualification: handle(async (req, res) => send(res, await service.getQualification(context(res), objectId(req.params.qualificationId)))),
    updateQualification: handle(async (req, res) => send(res, await service.updateQualification(context(res), objectId(req.params.qualificationId), validateQualification(req.body, true), req.get('if-match')))),
    getAvailability: handle(async (_req, res) => send(res, await service.getAvailability(context(res)))),
    createAvailability: handle(async (req, res) => {
      requireCreate(req.get('if-none-match')); send(res, await service.createAvailability(context(res), validateAvailability(req.body)), 201);
    }),
    updateAvailability: handle(async (req, res) => send(res, await service.updateAvailability(context(res), validateAvailability(req.body, true), req.get('if-match')))),
  };
}
