import express from 'express';
import { isDatabaseHealthy } from './config/database';
import { getJwtSecret } from './config/token';
import { ApiError } from './config/errors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import { loadDemoConfig } from './demo/config';
import { createDemoIdentityRoutes } from './demo/routes';
import { managerInvitationRoutes,managementIdentityRoutes } from './manager-invitations';
import { loadContract } from './management-contract';

export function createApp() {
  getJwtSecret();
  const demo = loadDemoConfig();
  const app = express();
  app.disable('x-powered-by');
  if (demo) {
    app.use('/internal/demo', createDemoIdentityRoutes(demo));
    app.post('/auth/register', (_req, _res, next) => next(new ApiError(403, 'DEMO_FIXTURES_ONLY', 'Use explicit fictional fixture preparation in this isolated demo')));
  }
  app.use(express.json({ limit: '16kb' }));
  const management=loadContract('auth');
  if(management)app.use('/internal/v1/management',managementIdentityRoutes(management));
  app.use('/auth/manager-invitations',managerInvitationRoutes());
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
