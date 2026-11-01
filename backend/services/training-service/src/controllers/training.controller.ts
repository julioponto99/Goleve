import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { Difficulty, ExerciseType, TrainingEnvironment } from '../models/exercise.model';
import { TrainingService } from '../services/training.service';

const ctx = (res: Response) => res.locals.context as RequestContext;
const work = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
function options(query: Request['query']) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, 'INVALID_PAGINATION', 'page must be positive and pageSize must be between 1 and 100');
  return {
    page, pageSize,
    status: query.status === undefined ? undefined : String(query.status) as 'active' | 'archived',
    environment: query.environment === undefined ? undefined : String(query.environment) as TrainingEnvironment,
    difficulty: query.difficulty === undefined ? undefined : String(query.difficulty) as Difficulty,
    type: query.type === undefined ? undefined : String(query.type) as ExerciseType,
    muscleGroup: query.muscleGroup === undefined ? undefined : String(query.muscleGroup),
  };
}
export function createTrainingController(service: TrainingService) {
  return {
    listExercises: work(async (req, res) => res.json({ data: await service.listExercises(ctx(res), options(req.query)) })),
    createExercise: work(async (req, res) => res.status(201).json({ data: await service.createExercise(ctx(res), req.body) })),
    getExercise: work(async (req, res) => res.json({ data: await service.getExercise(ctx(res), req.params.exerciseId) })),
    createPlan: work(async (req, res) => res.status(201).json({ data: await service.createPlan(ctx(res), req.body) })),
    listPlans: work(async (req, res) => res.json({ data: await service.listPlans(ctx(res), options(req.query)) })),
    getPlan: work(async (req, res) => res.json({ data: await service.getPlan(ctx(res), req.params.planId) })),
    updatePlan: work(async (req, res) => res.json({ data: await service.updatePlan(ctx(res), req.params.planId, req.body) })),
    archivePlan: work(async (req, res) => res.json({ data: await service.archivePlan(ctx(res), req.params.planId) })),
    duplicatePlan: work(async (req, res) => res.status(201).json({ data: await service.duplicatePlan(ctx(res), req.params.planId) })),
    addPlanExercise: work(async (req, res) => res.json({ data: await service.addPlanExercise(ctx(res), req.params.planId, req.body) })),
    removePlanExercise: work(async (req, res) => res.json({ data: await service.removePlanExercise(ctx(res), req.params.planId, req.params.exerciseId) })),
    createSession: work(async (req, res) => res.status(201).json({ data: await service.createSession(ctx(res), req.body) })),
    listSessions: work(async (req, res) => res.json({ data: await service.listSessions(ctx(res), options(req.query)) })),
    getSession: work(async (req, res) => res.json({ data: await service.getSession(ctx(res), req.params.sessionId) })),
    transition: work(async (req, res) => res.json({ data: await service.transitionSession(ctx(res), req.params.sessionId, req.params.action as 'start' | 'pause' | 'resume' | 'complete' | 'cancel') })),
    recordExercise: work(async (req, res) => res.status(201).json({ data: await service.recordExercise(ctx(res), req.params.sessionId, req.body) })),
  };
}
