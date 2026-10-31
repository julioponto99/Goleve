import express from 'express';
import { isDatabaseHealthy } from './config/database';
import { getJwtSecret } from './config/token';
import { ApiError } from './config/errors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

export function createApp() {
  getJwtSecret();
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/health', async (_req, res) => {
    const healthy = await isDatabaseHealthy();
    res.status(healthy ? 200 : 503).json({
      service: 'auth-service',
      status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'connected' : 'unavailable',
    });
  });
  app.use('/auth', authRoutes);
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
