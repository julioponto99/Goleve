import express from 'express';
import { Connection } from 'mongoose';
import { isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { AgendaModels } from './models';
import { createAgendaRoutes } from './routes/agenda.routes';
import { AgendaService } from './services/agenda.service';

export function createApp(authServiceUrl: string, connection: Connection, models: AgendaModels) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'agenda-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable' });
  });
  app.use('/agenda', authenticate(authServiceUrl), express.json({ limit: '16kb' }), async (_req, _res, next) => {
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Agenda database is unavailable')); return; }
    next();
  }, createAgendaRoutes(new AgendaService(models)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
