import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { HydrationService } from '../services/hydration.service';
const context = (res: Response) => res.locals.context as RequestContext;
const work = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
function options(query: Request['query']) {
  const page = query.page === undefined ? 1 : Number(query.page), pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, 'INVALID_PAGINATION', 'page must be positive and pageSize must be between 1 and 100');
  return { page, pageSize, from: query.from === undefined ? undefined : String(query.from), to: query.to === undefined ? undefined : String(query.to), timezone: query.timezone === undefined ? undefined : String(query.timezone) };
}
export function createHydrationController(service: HydrationService) {
  return {
    suggest: work(async (req, res) => res.json({ data: await service.suggest(req.body) })),
    getGoal: work(async (_req, res) => res.json({ data: await service.getGoal(context(res)) })),
    setGoal: work(async (req, res) => res.json({ data: await service.setGoal(context(res), req.body) })),
    goalHistory: work(async (_req, res) => res.json({ data: await service.history(context(res)) })),
    createIntake: work(async (req, res) => {
      const result = await service.createIntake(context(res), req.body);
      res.status(result.created ? 201 : 200).json({ data: result.item });
    }),
    daily: work(async (req, res) => res.json({ data: await service.daily(context(res), String(req.query.date), String(req.query.timezone)) })),
    history: work(async (req, res) => res.json({ data: await service.historyIntakes(context(res), options(req.query)) })),
    updateIntake: work(async (req, res) => res.json({ data: await service.updateIntake(context(res), req.params.intakeId, req.body) })),
    deleteIntake: work(async (req, res) => res.json({ data: await service.deleteIntake(context(res), req.params.intakeId) })),
    getReminder: work(async (_req, res) => res.json({ data: await service.getReminder(context(res)) })),
    setReminder: work(async (req, res) => res.json({ data: await service.setReminder(context(res), req.body) })),
  };
}
