import { Router } from 'express';
import { createUserProxy } from '../services/user-proxy.service';

export function createUserRoutes() {
  const router = Router();
  router.use(createUserProxy());
  return router;
}
