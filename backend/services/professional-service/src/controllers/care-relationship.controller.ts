import { Request, Response, NextFunction } from 'express';
import { CareRelationshipService } from '../services/care-relationship.service';
import { RequestContext } from '../services/professional.service';
import { entityTag, idempotencyKey, pageOptions } from '../config/http';
import { objectId } from '../config/validation';
import { relationshipPage, validateRelationship, validateRelationshipCommand } from '../config/relationship-validation';
export function createCareRelationshipController(service: CareRelationshipService) {
  const ctx = (res: Response) => res.locals.context as RequestContext;
  const send = (res: Response, data: unknown, status = 200) => {
    if (data && typeof data === 'object' && 'id' in data && 'version' in data) res.set('ETag', entityTag(String(data.id), Number(data.version)));
    res.status(status).json({ data });
  };
  const handle = (work: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => { work(req, res).catch(next); };
  return {
    create: handle(async (req, res) => {
      const result = await service.create(ctx(res), validateRelationship(req.body), idempotencyKey(req.get('idempotency-key')));
      if (result.replayed) res.set('Idempotency-Replayed', 'true'); send(res, result.data, result.replayed ? 200 : 201);
    }),
    list: handle(async (req, res) => send(res, await service.list(ctx(res), relationshipPage(req.query)))),
    inbox: handle(async (req, res) => send(res, await service.list(ctx(res), relationshipPage(req.query), true))),
    get: handle(async (req, res) => send(res, await service.get(ctx(res), objectId(req.params.relationshipId)))),
    history: handle(async (req, res) => send(res, await service.history(ctx(res), objectId(req.params.relationshipId)))),
    eligible: handle(async (req, res) => send(res, await service.eligibleCapabilities(ctx(res), pageOptions(req.query)))),
    command: (action: 'accept' | 'decline' | 'cancel' | 'end') => handle(async (req, res) => {
      validateRelationshipCommand(req.body);
      const result = await service.command(ctx(res), objectId(req.params.relationshipId), action, req.get('if-match'), idempotencyKey(req.get('idempotency-key')));
      if (result.replayed) res.set('Idempotency-Replayed', 'true'); send(res, result.data);
    }),
  };
}
