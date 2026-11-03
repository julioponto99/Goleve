import { localDemo } from './local-demo';
import { localIdentityRoutes } from './local-demo.routes';
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
import { securityRoutes,administrationRoutes,internalAdministrationRoutes } from './administration/routes';
import { SecurityService } from './administration/security.service';
import { AuthUser } from './models/auth-user.model';
import { auditAdministrativeFailure } from './administration/audit.middleware';

export function createApp(options?:{securityForTests?:SecurityService}) {
  if(options?.securityForTests&&(process.env.NODE_ENV!=='test'||!/^goleve_administration511_[a-f0-9]+_auth$/.test(AuthUser.db.name)))throw new Error('Security clock injection restricted to isolated automated tests');
  getJwtSecret(); localDemo.policy();
  const demo = loadDemoConfig();
  const app = express();
  app.locals.security=options?.securityForTests||new SecurityService();
  app.disable('x-powered-by');
  if (demo) {
    app.use('/internal/demo', createDemoIdentityRoutes(demo));
    app.post('/auth/register', (_req, _res, next) => next(new ApiError(403, 'DEMO_FIXTURES_ONLY', 'Use explicit fictional fixture preparation in this isolated demo')));
  }
  app.use(express.json({ limit: '16kb' }));
  if(localDemo.policy())app.use('/internal/v1/local-demo',localIdentityRoutes());
  const management=loadContract('auth');
  if(management){app.use('/internal/v1/management',managementIdentityRoutes(management,app.locals.security));app.use('/internal/v1/management',internalAdministrationRoutes(management,app.locals.security));}
  app.use('/auth',securityRoutes(app.locals.security));
  app.use('/auth/administration',administrationRoutes(app.locals.security));
  app.use('/auth/manager-invitations',managerInvitationRoutes(app.locals.security));
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
  app.use(auditAdministrativeFailure,errorHandler);
  return app;
}
