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
import { ApplicationService, requireReviewer } from './services/application.service';
import { createApplicationController } from './controllers/application.controller';
import { createApplicationRoutes } from './routes/application.routes';
import { NextFunction, Request, Response } from 'express';
export function createApp(settings: ProfessionalSettings, connection: Connection, models: ProfessionalModels) {
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store'); const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'professional-service', status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'connected' : 'unavailable', dataMode: settings.dataMode });
  });
  const applications = new ApplicationService(models, settings);
  app.use(['/professionals', '/professional-applications'], (_req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Professional-Data-Mode', settings.dataMode); next();
  });
  const available = async (_req: Request, _res: Response, next: NextFunction) => {
    if (settings.dataMode !== 'synthetic') { next(new ApiError(503, 'PROFESSIONAL_DATA_DISABLED', 'This phase supports only explicitly enabled synthetic data')); return; }
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Professional database is unavailable')); return; }
    next();
  };
  app.get('/professionals/catalog', available, createApplicationController(applications).catalog);
  app.use(['/professionals', '/professional-applications'], authenticate(settings.authServiceUrl));
  app.use('/professional-applications', (_req, res, next) => {
    try { requireReviewer(res.locals.context, settings); next(); } catch (error) { next(error); }
  }, express.json({ limit: '16kb' }), available, createApplicationRoutes(applications));
  app.use('/professionals', express.json({ limit: '16kb' }), available, createProfessionalRoutes(new ProfessionalService(models), applications));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler); return app;
}
