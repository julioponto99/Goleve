import { Router } from 'express';
import { createAgendaProxy } from '../services/agenda-proxy.service';
export function createAgendaRoutes() {
  const router = Router();
  router.use(createAgendaProxy());
  return router;
}
