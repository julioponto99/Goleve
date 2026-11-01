import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { PerformanceService, ListOptions } from '../services/performance.service';
const context = (res: Response) => res.locals.context as RequestContext;
const work = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
function options(query: Request['query']): ListOptions {
  const page = query.page === undefined ? 1 : Number(query.page), pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, 'INVALID_PAGINATION', 'page must be positive and pageSize must be between 1 and 100');
  return { page, pageSize, from: query.from === undefined ? undefined : String(query.from), to: query.to === undefined ? undefined : String(query.to) };
}
export function createPerformanceController(service: PerformanceService) {
  return {
    createMeasurement: work(async (req, res) => { const result = await service.createMeasurement(context(res), req.body); res.status(result.created ? 201 : 200).json({ data: result.item }); }),
    listMeasurements: work(async (req, res) => { res.json({ data: await service.listMeasurements(context(res), options(req.query)) }); }),
    updateMeasurement: work(async (req, res) => { res.json({ data: await service.updateMeasurement(context(res), req.params.measurementId, req.body) }); }),
    deleteMeasurement: work(async (req, res) => { res.json({ data: await service.deleteMeasurement(context(res), req.params.measurementId) }); }),
    measurementEvolution: work(async (req, res) => { res.json({ data: await service.measurementEvolution(context(res), options(req.query)) }); }),
    createSteps: work(async (req, res) => { const result = await service.createSteps(context(res), req.body); res.status(result.created ? 201 : 200).json({ data: result.item }); }),
    listSteps: work(async (req, res) => { res.json({ data: await service.listSteps(context(res), options(req.query)) }); }),
    dailySteps: work(async (req, res) => { res.json({ data: await service.dailySteps(context(res), String(req.query.date), String(req.query.timezone)) }); }),
    stepsSummary: work(async (req, res) => { res.json({ data: await service.stepsSummary(context(res), options(req.query)) }); }),
    createHeartRate: work(async (req, res) => { const result = await service.createHeartRate(context(res), req.body); res.status(result.created ? 201 : 200).json({ data: result.item }); }),
    heartRateHistory: work(async (req, res) => { res.json({ data: await service.heartRateHistory(context(res), options(req.query)) }); }),
    heartRateSummary: work(async (req, res) => { res.json({ data: await service.heartRateSummary(context(res), options(req.query)) }); }),
    listGoals: work(async (_req, res) => { res.json({ data: await service.listGoals(context(res)) }); }),
    setGoal: work(async (req, res) => { res.json({ data: await service.setGoal(context(res), req.params.kind, req.body) }); }),
    overview: work(async (_req, res) => { res.json({ data: await service.overview(context(res)) }); }),
  };
}
