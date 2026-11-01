import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createNotificationModels, initializeModels } from './models';
import { createNotificationRoutes } from './routes/notification.routes';
import { NotificationService } from './services/notification.service';
import { NotificationConsumer } from './messaging/rabbitmq';

export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, service: NotificationService, consumer?: NotificationConsumer) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    const database = await isDatabaseHealthy(connection);
    const rabbitmq = consumer ? consumer.isHealthy() : false;
    res.status(database ? 200 : 503).json({ service: 'notification-service', status: database && rabbitmq ? 'ok' : 'degraded', database: database ? 'connected' : 'unavailable', rabbitmq: rabbitmq ? 'connected' : 'unavailable' });
  });
  app.use('/notifications', authenticate(authServiceUrl), express.json({ limit: '32kb' }), async (_req, _res, next) => { if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Notification database is unavailable')); return; } next(); }, createNotificationRoutes(service));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
if (require.main === module) void (async () => {
  const connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createNotificationModels(connection);
  await initializeModels(models);
  const service = new NotificationService(models);
  const consumer = new NotificationConsumer(process.env.RABBITMQ_URL || '', service);
  try { await consumer.start(); } catch (error) { console.error('notification-service RabbitMQ unavailable', error instanceof Error ? error.message : 'unknown'); }
  const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, service, consumer);
  app.listen(Number(process.env.PORT || 3010), () => console.log(`notification-service running on ${process.env.PORT || 3010}`));
})().catch((error) => { console.error('notification-service failed to start', error); process.exitCode = 1; });
