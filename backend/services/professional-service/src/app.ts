import express from 'express';
import { Connection } from 'mongoose';
import { isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { ProfessionalSettings } from './config/settings';
import { ProfessionalModels } from './models';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createProfessionalRoutes } from './routes/professional.routes';
import { ProfessionalService } from './services/professional.service';
export function createApp(settings: ProfessionalSettings, connection: Connection, models: ProfessionalModels) {
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store'); const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'professional-service', status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'connected' : 'unavailable', dataMode: settings.dataMode });
  });
  app.use('/professionals', (_req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Professional-Data-Mode', settings.dataMode); next();
  }, authenticate(settings.authServiceUrl), (_req, _res, next) => {
    if (settings.dataMode !== 'synthetic') { next(new ApiError(503, 'PROFESSIONAL_DATA_DISABLED', 'This phase supports only explicitly enabled synthetic data')); return; }
    next();
  }, express.json({ limit: '16kb' }), async (_req, _res, next) => {
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Professional database is unavailable')); return; }
    next();
  }, createProfessionalRoutes(new ProfessionalService(models)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler); return app;
}
