import { NextFunction, Request, Response } from 'express';
import { ApplicationService } from '../services/application.service';
import { RequestContext } from '../services/professional.service';
import { entityTag, idempotencyKey, pageOptions } from '../config/http';
import { applicationPage, validateReview, validateSubmission } from '../config/application-validation';
import { objectId } from '../config/validation';
export function createApplicationController(service: ApplicationService) {
  const ctx = (res: Response) => res.locals.context as RequestContext;
  const send = (res: Response, data: unknown, status = 200) => {
    if (data && typeof data === 'object' && 'id' in data && 'version' in data) res.set('ETag', entityTag(String(data.id), Number(data.version)));
    res.status(status).json({ data });
  };
  const command = (res: Response, result: { data: unknown; replayed: boolean }, status = 200) => {
    if (result.replayed) res.set('Idempotency-Replayed', 'true'); send(res, result.data, result.replayed ? 200 : status);
  };
  const handle = (work: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => { work(req, res).catch(next); };
  return {
    status: handle(async (_req, res) => send(res, await service.ownStatus(ctx(res)))),
    submit: handle(async (req, res) => command(res, await service.submit(ctx(res), validateSubmission(req.body), req.get('if-match'), idempotencyKey(req.get('idempotency-key'))), 201)),
    reopen: handle(async (req, res) => { validateReview('reopen', req.body); command(res, await service.reopen(ctx(res), req.get('if-match'), idempotencyKey(req.get('idempotency-key')))); }),
    list: handle(async (req, res) => send(res, await service.list(ctx(res), applicationPage(req.query)))),
    detail: handle(async (req, res) => send(res, await service.detail(ctx(res), objectId(req.params.applicationId)))),
    history: handle(async (req, res) => send(res, await service.history(ctx(res), objectId(req.params.applicationId)))),
    decide: (action: 'approve' | 'reject' | 'suspend') => handle(async (req, res) => command(res,
      await service.decide(ctx(res), objectId(req.params.applicationId), action, validateReview(action, req.body), req.get('if-match'), idempotencyKey(req.get('idempotency-key'))))),
    catalog: handle(async (req, res) => send(res, await service.catalog(pageOptions(req.query)))),
  };
}
