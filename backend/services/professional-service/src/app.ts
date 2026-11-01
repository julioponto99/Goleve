import express from 'express';
import { Connection } from 'mongoose';
import { isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { ProfessionalSettings } from './config/settings';
import { ProfessionalModels } from './models';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { createProfessionalRoutes } from './routes/professional.routes';
import { ProfessionalService } from './services/professional.service';
import { ApplicationService, requireReviewer } from './services/application.service';
import { createApplicationController } from './controllers/application.controller';
import { createApplicationRoutes } from './routes/application.routes';
import { NextFunction, Request, Response } from 'express';
import { CareEligibilityProvider, ProfessionalCareEligibility } from './services/care-eligibility.service';
import { CareRelationshipService } from './services/care-relationship.service';
import { createCareRelationshipController } from './controllers/care-relationship.controller';
import { createCareRelationshipRoutes } from './routes/care-relationship.routes';
import { DemoIdentityClient } from './demo/identity-client';
import { createAgendaInternalRoutes } from './internal/agenda.routes';
import { createProfessionalOfferingController } from './controllers/professional-offering.controller';
import { ProfessionalOfferingService } from './services/professional-offering.service';
import { createPaymentDemoRoutes } from './payment-demo/routes';
export interface CareDependencies { eligibility?: CareEligibilityProvider; now?: () => Date }
export function createApp(settings: ProfessionalSettings, connection: Connection, models: ProfessionalModels, dependencies: CareDependencies = {}) {
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  if(settings.paymentDemo){if(settings.dataMode!=='synthetic'||settings.reviewMode!=='synthetic')throw new Error('Synthetic Professional review required');app.use('/internal/v1/payment-demo',createPaymentDemoRoutes(connection,models,settings.paymentDemo));}
  if (settings.agendaServiceKeys) app.use('/internal/v1/agenda', createAgendaInternalRoutes(connection, models, settings.agendaServiceKeys, settings.demoEligibilityEnabled));
  app.get('/health', async (_req, res) => {
    res.set('Cache-Control', 'no-store'); const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'professional-service', status: healthy ? 'ok' : 'unavailable',
      database: healthy ? 'connected' : 'unavailable', dataMode: settings.dataMode });
  });
  const applications = new ApplicationService(models, settings);
  const offerings = createProfessionalOfferingController(new ProfessionalOfferingService(models));
  const identity = settings.demoIdentity ? new DemoIdentityClient(settings.authServiceUrl, settings.demoIdentity) : undefined;
  const relationships = new CareRelationshipService(models, dependencies.eligibility || new ProfessionalCareEligibility(models, settings, identity), settings.careInvitationTtlDays ?? 7, dependencies.now);
  const careController = createCareRelationshipController(relationships);
  app.use(['/professionals', '/professional-applications', '/care-relationships'], (_req, res, next) => {
    res.set('Cache-Control', 'no-store'); res.set('X-Professional-Data-Mode', settings.dataMode); next();
  });
  const available = async (_req: Request, _res: Response, next: NextFunction) => {
    if (settings.dataMode !== 'synthetic') { next(new ApiError(503, 'PROFESSIONAL_DATA_DISABLED', 'This phase supports only explicitly enabled synthetic data')); return; }
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Professional database is unavailable')); return; }
    next();
  };
  app.get('/professionals/catalog', available, createApplicationController(applications).catalog);
  app.get('/professionals/services', available, offerings.publicCatalog);
  app.use(['/professionals', '/professional-applications', '/care-relationships'], authenticate(settings.authServiceUrl));
  app.use('/professional-applications', (_req, res, next) => {
    try { requireReviewer(res.locals.context, settings); next(); } catch (error) { next(error); }
  }, express.json({ limit: '16kb' }), available, createApplicationRoutes(applications));
  app.get('/professionals/eligible-capabilities', available, careController.eligible);
  app.get('/professionals/me/care-relationships', available, careController.inbox);
  app.use('/care-relationships', express.json({ limit: '16kb' }), available, createCareRelationshipRoutes(relationships));
  app.use('/professionals', express.json({ limit: '16kb' }), available, createProfessionalRoutes(new ProfessionalService(models), applications));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler); return app;
}
