import { Router } from 'express';
import { createHydrationController } from '../controllers/hydration.controller';
import { HydrationService } from '../services/hydration.service';
export function createHydrationRoutes(service: HydrationService) {
  const router = Router(), controller = createHydrationController(service);
  router.post('/goal/suggest', controller.suggest);
  router.get('/goal', controller.getGoal);
  router.put('/goal', controller.setGoal);
  router.get('/goal/history', controller.goalHistory);
  router.post('/intakes', controller.createIntake);
  router.get('/intakes/daily', controller.daily);
  router.get('/intakes', controller.history);
  router.patch('/intakes/:intakeId', controller.updateIntake);
  router.delete('/intakes/:intakeId', controller.deleteIntake);
  router.get('/reminders', controller.getReminder);
  router.put('/reminders', controller.setReminder);
  return router;
}
