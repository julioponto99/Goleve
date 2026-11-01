import { Router } from 'express';
import { createProfessionalProxy } from '../services/professional-proxy.service';
export function createProfessionalRoutes() { const router = Router(); router.use(createProfessionalProxy()); return router; }
