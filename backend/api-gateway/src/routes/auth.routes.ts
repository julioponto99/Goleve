import { Router } from 'express';
import { createAuthProxy } from '../services/auth-proxy.service';

export function createAuthRoutes() {
  const router = Router();
  router.use(createAuthProxy());
  return router;
}
