import { Router } from 'express';
import { createUserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';

export function createUserRoutes(service: UserService) {
  const router = Router();
  const c = createUserController(service);
  router.get('/me', c.getProfile);
  router.put('/me', c.createProfile);
  router.patch('/me', c.updateProfile);
  router.get('/me/preferences', c.getPreferences);
  router.put('/me/preferences', c.createPreferences);
  router.patch('/me/preferences', c.updatePreferences);
  router.get('/me/habits', c.getHabits);
  router.put('/me/habits', c.createHabits);
  router.patch('/me/habits', c.updateHabits);
  router.get('/me/physical-data', c.physicalData);
  router.get('/me/weight-history', c.weightHistory);
  router.get('/me/measurements', c.listMeasurements);
  router.post('/me/measurements', c.createMeasurement);
  router.get('/me/measurements/:measurementId', c.getMeasurement);
  router.get('/me/goals', c.listGoals);
  router.post('/me/goals', c.createGoal);
  router.get('/me/goals/:goalId', c.getGoal);
  router.patch('/me/goals/:goalId', c.updateGoal);
  return router;
}
