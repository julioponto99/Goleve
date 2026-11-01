import { Router } from 'express';
import { createAgendaController } from '../controllers/agenda.controller';
import { AgendaService } from '../services/agenda.service';
export function createAgendaRoutes(service: AgendaService) {
  const router = Router(), controller = createAgendaController(service);
  router.get('/activities', controller.list);
  router.post('/activities', controller.create);
  router.get('/activities/:activityId', controller.get);
  router.patch('/activities/:activityId', controller.update);
  router.post('/activities/:activityId/complete', controller.complete);
  router.post('/activities/:activityId/cancel', controller.cancel);
  return router;
}
