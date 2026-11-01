import { Router } from 'express';
import { createTrainingProxy } from '../services/training-proxy.service';
export function createTrainingRoutes() { const router = Router(); router.use(createTrainingProxy()); return router; }
