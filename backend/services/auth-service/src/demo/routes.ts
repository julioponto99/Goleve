import { Router } from 'express';
import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import mongoose from 'mongoose';
import { DemoConfig } from './config';
import { DemoPreparation } from './models';
import { AuthUser } from '../models/auth-user.model';
import { ApiError } from '../config/errors';
export function createDemoIdentityRoutes(config: DemoConfig) {
  const router = Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  router.post('/identity', (req, _res, next) => {
    const supplied = req.get('x-goleve-demo-service');
    if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied) || !timingSafeEqual(Buffer.from(supplied, 'hex'), config.serviceKey)) {
      next(new ApiError(401, 'SERVICE_AUTHENTICATION_REQUIRED', 'Authorized demo service credential required')); return;
    }
    next();
  }, express.json({ limit: '1kb' }), async (req, res, next) => {
    try {
      const body = req.body;
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.id !== 'string' || !/^[a-f0-9]{24}$/.test(body.id)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'A fixture identity identifier is required');
      }
      if (mongoose.connection.db?.databaseName !== config.databaseName) throw new ApiError(503, 'DEMO_UNAVAILABLE', 'Isolated demo context is unavailable');
      const preparation = await DemoPreparation.findOne({ instanceId: config.instanceId, source: 'explicit_local_cli', expiresAt: { $gt: new Date() } });
      if (!preparation) throw new ApiError(503, 'DEMO_NOT_PREPARED', 'Explicit demo preparation is required');
      if (!preparation.identityIds.includes(body.id)) throw new ApiError(404, 'NOT_FOUND', 'Authorized fixture identity not found');
      const user = await AuthUser.findOne({ _id: body.id, demoInstanceId: config.instanceId, userType: { $in: ['utilizador', 'profissional'] } }).select('_id userType');
      if (!user) throw new ApiError(404, 'NOT_FOUND', 'Authorized fixture identity not found');
      res.json({ identity: { id: user._id.toHexString(), userType: user.userType } });
    } catch (error) { next(error); }
  });
  return router;
}
