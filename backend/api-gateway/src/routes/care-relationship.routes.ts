import { Router } from 'express';
import { createProfessionalProxy } from '../services/professional-proxy.service';
export function createCareRelationshipRoutes() {
  const router = Router(); router.use(createProfessionalProxy()); return router;
}
