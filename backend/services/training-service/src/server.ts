import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createTrainingModels, initializeModels } from './models';
import { createTrainingRoutes } from './routes/training.routes';
import { TrainingService } from './services/training.service';
import { assertTransactionsAvailable, outboxEnabled, publishPending } from './events/outbox';

export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, models: ReturnType<typeof createTrainingModels>) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'training-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable' });
  });
  app.use('/training', authenticate(authServiceUrl), express.json({ limit: '64kb' }), async (_req, _res, next) => {
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Training database is unavailable')); return; }
    next();
  }, createTrainingRoutes(new TrainingService(models)));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  void (async () => {
    const connection = await openDatabase(process.env.MONGO_URI || '');
    const models = createTrainingModels(connection);
    await initializeModels(models);
    if (outboxEnabled()) {
      await assertTransactionsAvailable(connection);
      setInterval(() => { void publishPending(models, process.env.RABBITMQ_URL || '').catch((error) => console.error('training outbox worker failed', error instanceof Error ? error.message : 'unknown')); }, 1000);
    }
    const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models);
    const port = Number(process.env.PORT || 3003);
    app.listen(port, () => console.log(`training-service running on ${port}`));
  })().catch((error) => { console.error('training-service failed to start', error); process.exitCode = 1; });
}
