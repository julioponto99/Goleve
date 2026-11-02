import express from 'express';
import { createAuthRoutes } from './routes/auth.routes';
import { createAuthRateLimiter } from './middlewares/auth-rate-limit.middleware';
import { createUserRoutes } from './routes/user.routes';
import { createProfessionalRoutes } from './routes/professional.routes';
import { createManagementRoutes } from './routes/management.routes';
import { createCareRelationshipRoutes } from './routes/care-relationship.routes';
import { createAgendaRoutes } from './routes/agenda.routes';
import { createTrainingRoutes } from './routes/training.routes';
import { createHydrationRoutes } from './routes/hydration.routes';
import { createPerformanceRoutes } from './routes/performance.routes';
import { createNotificationRoutes } from './routes/notification.routes';
import { createAiCoachRoutes } from './routes/ai-coach.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { publicBoundary, corsPolicy, apiRateLimiter, readiness } from './middlewares/integration.middleware';
import { createApiDocsRoutes } from './routes/api-docs.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.use(publicBoundary(), corsPolicy(), apiRateLimiter());
  app.get('/health', (_req, res) => res.json({ service: 'api-gateway', status: 'ok' }));
  app.get('/ready', readiness());
  app.use('/api-docs', createApiDocsRoutes());
  app.post(['/auth/register', '/auth/login'], createAuthRateLimiter());
  // Proxy the original request stream before any JSON body parser consumes it.
  app.use('/auth', createAuthRoutes());
  app.use('/users', createUserRoutes());
  app.use('/professionals', createProfessionalRoutes());
  app.use('/management', createManagementRoutes());
  app.use('/care-relationships', createCareRelationshipRoutes());
  app.use('/agenda', createAgendaRoutes());
  app.use('/training', createTrainingRoutes());
  app.use('/hydration', createHydrationRoutes());
  app.use('/performance', createPerformanceRoutes());
  app.use('/notifications', createNotificationRoutes());
  app.use('/ai-coach', createAiCoachRoutes());
  app.use('/payments', createPaymentRoutes());
  app.use(express.json());
  return app;
}
