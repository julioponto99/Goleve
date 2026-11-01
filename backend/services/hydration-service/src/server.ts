import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createHydrationModels, initializeModels } from './models';
import { createHydrationRoutes } from './routes/hydration.routes';
import { HydrationService } from './services/hydration.service';
import { assertTransactionsAvailable, outboxEnabled, publishPending } from './events/outbox';
export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, models: ReturnType<typeof createHydrationModels>) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => { const healthy = await isDatabaseHealthy(connection); res.status(healthy ? 200 : 503).json({ service: 'hydration-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable' }); });
  app.use('/hydration', authenticate(authServiceUrl), express.json({ limit: '32kb' }), async (_req, _res, next) => { if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Hydration database is unavailable')); return; } next(); }, createHydrationRoutes(new HydrationService(models)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
if (require.main === module) void (async () => {
  const connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createHydrationModels(connection);
  await initializeModels(models);
  if (outboxEnabled()) {
    await assertTransactionsAvailable(connection);
    setInterval(() => { void publishPending(models, process.env.RABBITMQ_URL || '').catch((error) => console.error('hydration outbox worker failed', error instanceof Error ? error.message : 'unknown')); }, 1000);
  }
  const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models);
  app.listen(Number(process.env.PORT || 3006), () => console.log(`hydration-service running on ${process.env.PORT || 3006}`));
})().catch((error) => { console.error('hydration-service failed to start', error); process.exitCode = 1; });
