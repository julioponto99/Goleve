import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { loadPaymentFixtures } from './config/fixtures';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createPaymentModels, initializeModels } from './models';
import { createPaymentRoutes } from './routes/payment.routes';
import { PaymentService } from './services/payment.service';

export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, models: ReturnType<typeof createPaymentModels>) {
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_DEMO_ENABLED !== 'true') throw new Error('Payment Service is available only in explicitly enabled local demonstration mode');
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => { const healthy = await isDatabaseHealthy(connection); res.status(healthy ? 200 : 503).json({ service: 'payment-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable', mode: 'demo' }); });
  app.use('/payments', authenticate(authServiceUrl), express.json({ limit: '16kb' }), createPaymentRoutes(new PaymentService(models, loadPaymentFixtures())));
  app.use((_req, _res, next) => next(new Error('Endpoint not found')));
  app.use(errorHandler); return app;
}
if (require.main === module) void (async () => {
  const connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createPaymentModels(connection); await initializeModels(models);
  const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models);
  app.listen(Number(process.env.PORT || 3009), () => console.log(`payment-service running on ${process.env.PORT || 3009}`));
})().catch((error) => { console.error('payment-service failed to start', error instanceof Error ? error.message : 'unknown'); process.exitCode = 1; });
