import { Router } from 'express';
import { createManagementProxy } from '../services/management-proxy.service';
export function createManagementRoutes() { const router = Router(); router.use(createManagementProxy()); return router; }
