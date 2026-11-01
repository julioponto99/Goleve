import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createPerformanceModels, initializeModels } from './models';
import { createPerformanceRoutes } from './routes/performance.routes';
import { PerformanceService } from './services/performance.service';

export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, models: ReturnType<typeof createPerformanceModels>) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => { const healthy = await isDatabaseHealthy(connection); res.status(healthy ? 200 : 503).json({ service: 'performance-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable' }); });
  app.use('/performance', authenticate(authServiceUrl), express.json({ limit: '32kb' }), async (_req, _res, next) => { if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Performance database is unavailable')); return; } next(); }, createPerformanceRoutes(new PerformanceService(models)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
if (require.main === module) void (async () => {
  const connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createPerformanceModels(connection);
  await initializeModels(models);
  const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models);
  app.listen(Number(process.env.PORT || 3005), () => console.log(`performance-service running on ${process.env.PORT || 3005}`));
})().catch((error) => { console.error('performance-service failed to start', error); process.exitCode = 1; });
