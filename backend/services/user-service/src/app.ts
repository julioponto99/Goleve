import express from 'express';
import { Connection } from 'mongoose';
import { createEncryption } from './config/encryption';
import { ApiError } from './config/errors';
import { isDatabaseHealthy } from './config/database';
import { UserSettings } from './config/settings';
import { UserModels } from './models';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createUserRoutes } from './routes/user.routes';
import { UserService } from './services/user.service';

export function createApp(settings: UserSettings, connection: Connection, models: UserModels) {
  if (settings.dataMode === 'synthetic' && !settings.encryptionKey) {
    throw new Error('Synthetic User mode requires an encryption key');
  }
  const app = express();
  app.disable('x-powered-by');
  app.disable('etag');
  const service = new UserService(models, settings.encryptionKey ? createEncryption(settings.encryptionKey) : undefined);
  app.get('/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'user-service', status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'connected' : 'unavailable', dataMode: settings.dataMode });
  });
  app.use('/users', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-User-Data-Mode', settings.dataMode);
    next();
  }, authenticate(settings.authServiceUrl), (_req, _res, next) => {
    if (settings.dataMode !== 'synthetic') {
      next(new ApiError(503, 'USER_DATA_DISABLED', 'This phase supports only explicitly enabled synthetic data')); return;
    }
    next();
  }, express.json({ limit: '16kb' }), async (_req, _res, next) => {
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'User database is unavailable')); return; }
    next();
  }, createUserRoutes(service));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
