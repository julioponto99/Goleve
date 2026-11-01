import express from 'express';
import 'dotenv/config';
import { openDatabase, isDatabaseHealthy } from './config/database';
import { loadPaymentFixtures } from './config/fixtures';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createPaymentModels, initializeModels } from './models';
import { createPaymentRoutes } from './routes/payment.routes';
import { PaymentService } from './services/payment.service';
import { DemoConfig,loadDemo } from './payment-demo/protocol';
import { IntegratedPaymentService } from './payment-demo/service';
import { integratedPaymentRoutes } from './payment-demo/routes';
import { assertNotificationDemo, publishPaymentOutbox } from './events/outbox';
import { integratedPaymentModel } from './payment-demo/models';

export async function createApp(authServiceUrl: string, connection: import('mongoose').Connection, models: ReturnType<typeof createPaymentModels>,demo?:DemoConfig,bank?:import('./services/mock-bank.provider').MockBankProvider) {
  if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_DEMO_ENABLED !== 'true') throw new Error('Payment Service is available only in explicitly enabled local demonstration mode');
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => { const healthy = await isDatabaseHealthy(connection); res.status(healthy ? 200 : 503).json({ service: 'payment-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable', mode: 'demo' }); });
  if(bank&&(process.env.NODE_ENV!=='test'||!demo))throw new Error('Bank override requires an isolated integration test');
  if(demo){const service=new IntegratedPaymentService(connection,demo,bank);await service.Model.init();app.use('/payments',authenticate(authServiceUrl),express.json({limit:'16kb'}),integratedPaymentRoutes(service));}
  app.use('/payments', authenticate(authServiceUrl), express.json({ limit: '16kb' }), createPaymentRoutes(new PaymentService(models, loadPaymentFixtures())));
  app.use((_req, _res, next) => next(new Error('Endpoint not found')));
  app.use(errorHandler); return app;
}
if (require.main === module) void (async () => {
  const demo=loadDemo('payment');
  const connection = await openDatabase(process.env.MONGO_URI || '');
  const models = createPaymentModels(connection); await initializeModels(models);
  const notifications=process.env.PAYMENT_NOTIFICATION_EVENTS_ENABLED||'false';
  if(!['true','false'].includes(notifications))throw new Error('Invalid payment notification flag');
  if(notifications==='true'){assertNotificationDemo(connection.name);if(!process.env.PAYMENT_NOTIFICATION_RABBITMQ_URL)throw new Error('Dedicated demo RabbitMQ required');}
  const app = await createApp(process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001', connection, models,demo);
  const server=app.listen(Number(process.env.PORT || 3009), () => console.log(`payment-service running on ${process.env.PORT || 3009}`));
  let publishing:Promise<unknown>|undefined;
  const timer=notifications==='true'?setInterval(()=>{if(publishing)return;publishing=(async()=>{for(const model of [models.Payment,...(demo?[integratedPaymentModel(connection)]:[])])await publishPaymentOutbox(model,process.env.PAYMENT_NOTIFICATION_RABBITMQ_URL!);})().catch(()=>console.error('Payment notification outbox unavailable')).finally(()=>{publishing=undefined;});},5000):undefined;
  const close=()=>{if(timer)clearInterval(timer);server.close(()=>{void Promise.resolve(publishing).finally(()=>connection.close());});};
  process.once('SIGTERM',close);process.once('SIGINT',close);
})().catch((error) => { console.error('payment-service failed to start', error instanceof Error ? error.message : 'unknown'); process.exitCode = 1; });
