import { Router } from 'express';
import { CoachService } from '../services/coach.service';
import { createCoachController } from '../controllers/coach.controller';
export function createCoachRoutes(service: CoachService) {
  const r = Router(), c = createCoachController(service);
  r.post('/conversations', c.create); r.get('/conversations', c.list);
  r.patch('/conversations/:id/permissions', c.permissions); r.delete('/conversations/:id', c.remove);
  r.post('/conversations/:id/messages', c.send); r.get('/conversations/:id/messages', c.history);
  r.get('/conversations/:id/recommendations', c.recommendations);
  r.get('/conversations/:id/proposals', c.proposals); r.get('/conversations/:id/actions', c.actions);
  r.post('/proposals/:id/confirm', c.confirm); r.post('/proposals/:id/reject', c.reject); r.post('/proposals/:id/reconcile', c.reconcile);
  return r;
}
