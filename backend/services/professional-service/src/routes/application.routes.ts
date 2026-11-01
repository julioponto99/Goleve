import { Router } from 'express';
import { createApplicationController } from '../controllers/application.controller';
import { ApplicationService } from '../services/application.service';
export function createApplicationRoutes(service: ApplicationService) {
  const router = Router(), controller = createApplicationController(service);
  router.get('/', controller.list);
  router.get('/:applicationId', controller.detail);
  router.get('/:applicationId/history', controller.history);
  router.post('/:applicationId/approve', controller.decide('approve'));
  router.post('/:applicationId/reject', controller.decide('reject'));
  router.post('/:applicationId/suspend', controller.decide('suspend'));
  return router;
}
