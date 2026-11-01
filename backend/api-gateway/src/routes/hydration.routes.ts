import { Router } from 'express';
import { createHydrationProxy } from '../services/hydration-proxy.service';
export function createHydrationRoutes() { const router = Router(); router.use(createHydrationProxy()); return router; }
