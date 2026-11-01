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

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);
  app.get('/health', (_req, res) => res.json({ service: 'api-gateway', status: 'ok' }));
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
  app.use(express.json());
  return app;
}
