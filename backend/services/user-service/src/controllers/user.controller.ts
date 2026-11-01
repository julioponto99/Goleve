import { NextFunction, Request, Response } from 'express';
import { UserService, RequestContext } from '../services/user.service';
import { entityTag, idempotencyKey, pageOptions, requireCreate } from '../config/http';
import { objectId, validateGoal, validateHabits, validateMeasurement, validatePreferences, validateProfile } from '../config/validation';

export function createUserController(service: UserService) {
  const context = (res: Response) => res.locals.context as RequestContext;
  const send = (res: Response, data: unknown, status = 200) => {
    if (data && typeof data === 'object' && 'id' in data && 'version' in data) {
      res.set('ETag', entityTag(String(data.id), Number(data.version)));
    }
    res.status(status).json({ data });
  };
  const handle = (work: (req: Request, res: Response) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction): void => { work(req, res).catch(next); };
  return {
    getProfile: handle(async (_req, res) => send(res, await service.getProfile(context(res)))),
    createProfile: handle(async (req, res) => {
      requireCreate(req.get('if-none-match'));
      send(res, await service.createProfile(context(res), validateProfile(req.body)), 201);
    }),
    updateProfile: handle(async (req, res) => send(res,
      await service.updateProfile(context(res), validateProfile(req.body, true), req.get('if-match')))),
    getPreferences: handle(async (_req, res) => send(res, await service.getPreferences(context(res)))),
    createPreferences: handle(async (req, res) => {
      requireCreate(req.get('if-none-match'));
      send(res, await service.createPreferences(context(res), validatePreferences(req.body)), 201);
    }),
    updatePreferences: handle(async (req, res) => send(res,
      await service.updatePreferences(context(res), validatePreferences(req.body, true), req.get('if-match')))),
    getHabits: handle(async (_req, res) => send(res, await service.getHabits(context(res)))),
    createHabits: handle(async (req, res) => {
      requireCreate(req.get('if-none-match'));
      send(res, await service.createHabits(context(res), validateHabits(req.body)), 201);
    }),
    updateHabits: handle(async (req, res) => send(res,
      await service.updateHabits(context(res), validateHabits(req.body), req.get('if-match')))),
    createMeasurement: handle(async (req, res) => {
      const result = await service.createMeasurement(context(res), validateMeasurement(req.body), idempotencyKey(req.get('idempotency-key')));
      if (result.replayed) res.set('Idempotency-Replayed', 'true');
      send(res, result.data, result.replayed ? 200 : 201);
    }),
    getMeasurement: handle(async (req, res) => send(res, await service.getMeasurement(context(res), objectId(req.params.measurementId)))),
    listMeasurements: handle(async (req, res) => send(res,
      await service.listMeasurements(context(res), pageOptions(req.query, context(res).identity.id, 'measurements')))),
    weightHistory: handle(async (req, res) => send(res,
      await service.listMeasurements(context(res), pageOptions(req.query, context(res).identity.id, 'measurements', 'weight')))),
    physicalData: handle(async (_req, res) => send(res, await service.physicalData(context(res)))),
    createGoal: handle(async (req, res) => send(res, await service.createGoal(context(res), validateGoal(req.body)), 201)),
    getGoal: handle(async (req, res) => send(res, await service.getGoal(context(res), objectId(req.params.goalId)))),
    updateGoal: handle(async (req, res) => send(res,
      await service.updateGoal(context(res), objectId(req.params.goalId), validateGoal(req.body, true), req.get('if-match')))),
    listGoals: handle(async (req, res) => send(res,
      await service.listGoals(context(res), pageOptions(req.query, context(res).identity.id, 'goals')))),
  };
}
