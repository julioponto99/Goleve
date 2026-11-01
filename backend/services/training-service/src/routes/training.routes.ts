import { Router } from 'express';
import { createTrainingController } from '../controllers/training.controller';
import { TrainingService } from '../services/training.service';
export function createTrainingRoutes(service: TrainingService) {
  const router = Router(), controller = createTrainingController(service);
  router.get('/exercises', controller.listExercises);
  router.post('/exercises', controller.createExercise);
  router.get('/exercises/:exerciseId', controller.getExercise);
  router.post('/plans', controller.createPlan);
  router.get('/plans', controller.listPlans);
  router.get('/plans/:planId', controller.getPlan);
  router.patch('/plans/:planId', controller.updatePlan);
  router.post('/plans/:planId/archive', controller.archivePlan);
  router.post('/plans/:planId/duplicate', controller.duplicatePlan);
  router.post('/plans/:planId/exercises', controller.addPlanExercise);
  router.delete('/plans/:planId/exercises/:exerciseId', controller.removePlanExercise);
  router.post('/sessions', controller.createSession);
  router.get('/sessions', controller.listSessions);
  router.get('/sessions/:sessionId', controller.getSession);
  router.post('/sessions/:sessionId/:action(start|pause|resume|complete|cancel)', controller.transition);
  router.post('/sessions/:sessionId/exercises', controller.recordExercise);
  return router;
}
