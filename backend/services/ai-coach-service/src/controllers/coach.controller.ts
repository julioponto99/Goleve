import { NextFunction, Request, Response } from 'express';
import { CoachService } from '../services/coach.service';
import { RequestContext } from '../middlewares/auth.middleware';
import { idempotency, identifier, object } from '../config/validation';
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };
const ctx = (res: Response) => res.locals.context as RequestContext;
const id = (req: Request) => identifier(req.params.id);
const key = (req: Request) => idempotency(req.get('idempotency-key'));
export function createCoachController(service: CoachService) {
  return {
    create: run(async (req, res) => { const data = await service.create(ctx(res), req.body, key(req)); res.status(data.replayed ? 200 : 201).json({ data }); }),
    list: run(async (req, res) => res.json({ data: await service.list(ctx(res), req.query) })),
    permissions: run(async (req, res) => res.json({ data: await service.updatePermissions(ctx(res), id(req), req.body) })),
    remove: run(async (req, res) => { object(req.body || {}, []); res.json({ data: await service.remove(ctx(res), id(req)) }); }),
    history: run(async (req, res) => res.json({ data: await service.history(ctx(res), id(req), req.query) })),
    send: run(async (req, res) => res.json({ data: await service.send(ctx(res), id(req), req.body, key(req)) })),
    proposals: run(async (req, res) => res.json({ data: await service.proposals(ctx(res), id(req), req.query) })),
    actions: run(async (req, res) => res.json({ data: await service.proposals(ctx(res), id(req), req.query, true) })),
    recommendations: run(async (req, res) => res.json({ data: await service.recommendations(ctx(res), id(req), req.query) })),
    confirm: run(async (req, res) => res.json({ data: await service.resolve(ctx(res), id(req), req.body, key(req)) })),
    reject: run(async (req, res) => res.json({ data: await service.resolve(ctx(res), id(req), req.body, key(req), true) })),
    reconcile: run(async (req, res) => res.json({ data: await service.reconcile(ctx(res), id(req), req.body) })),
  };
}
