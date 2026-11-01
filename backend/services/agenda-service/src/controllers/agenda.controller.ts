import { NextFunction, Request, Response } from 'express';
import { AgendaService } from '../services/agenda.service';
import { PageOptions } from '../services/agenda.service';
import { RequestContext } from '../middlewares/auth.middleware';
import { ApiError } from '../config/errors';

const context = (res: Response) => res.locals.context as RequestContext;
const work = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => { fn(req, res).catch(next); };
function options(query: Request['query']) {
  const number = (value: unknown, fallback: number) => value === undefined ? fallback : Number(value);
  const page = number(query.page, 1), pageSize = number(query.pageSize, 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, 'INVALID_PAGINATION', 'page must be positive and pageSize must be between 1 and 100');
  const result: PageOptions = { page, pageSize };
  if (query.status !== undefined) result.status = String(query.status) as PageOptions['status'];
  if (query.kind !== undefined) result.kind = String(query.kind) as PageOptions['kind'];
  if (query.environment !== undefined) result.environment = String(query.environment) as PageOptions['environment'];
  if (query.from !== undefined) result.from = new Date(String(query.from));
  if (query.to !== undefined) result.to = new Date(String(query.to));
  if (result.from && Number.isNaN(result.from.getTime())) throw new ApiError(400, 'INVALID_DATE', 'from must be a valid ISO date');
  if (result.to && Number.isNaN(result.to.getTime())) throw new ApiError(400, 'INVALID_DATE', 'to must be a valid ISO date');
  return result;
}
export function createAgendaController(service: AgendaService) {
  return {
    create: work(async (req, res) => { res.status(201).json({ data: await service.create(context(res), req.body) }); }),
    list: work(async (req, res) => { res.json({ data: await service.list(context(res), options(req.query)) }); }),
    get: work(async (req, res) => { res.json({ data: await service.get(context(res), req.params.activityId) }); }),
    update: work(async (req, res) => { res.json({ data: await service.update(context(res), req.params.activityId, req.body) }); }),
    complete: work(async (req, res) => { res.json({ data: await service.complete(context(res), req.params.activityId) }); }),
    cancel: work(async (req, res) => { res.json({ data: await service.cancel(context(res), req.params.activityId) }); }),
  };
}
