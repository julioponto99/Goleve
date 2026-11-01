import express from 'express';
import { Connection } from 'mongoose';
import { isDatabaseHealthy } from './config/database';
import { ApiError } from './config/errors';
import { authenticate } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { AgendaModels } from './models';
import { createAgendaRoutes } from './routes/agenda.routes';
import { AgendaService } from './services/agenda.service';
import { ProfessionalAgendaSettings } from './professional/settings';
import { ProfessionalAgendaModels } from './professional/models';
import { AppointmentEligibility, ProfessionalEligibilityClient } from './professional/eligibility';
import { ProfessionalAgendaService } from './professional/service';
import { createProfessionalAgendaRoutes } from './routes/professional-agenda.routes';
export interface ProfessionalAgendaRuntime { settings: ProfessionalAgendaSettings; models: ProfessionalAgendaModels; eligibilityForTests?: AppointmentEligibility; nowForTests?: () => Date }

export function createApp(authServiceUrl: string, connection: Connection, models: AgendaModels, professional?: ProfessionalAgendaRuntime) {
  const app = express();
  app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => {
    const healthy = await isDatabaseHealthy(connection);
    res.status(healthy ? 200 : 503).json({ service: 'agenda-service', status: healthy ? 'ok' : 'unavailable', database: healthy ? 'connected' : 'unavailable' });
  });
  app.use('/agenda', authenticate(authServiceUrl), express.json({ limit: '16kb' }), async (_req, _res, next) => {
    if (!await isDatabaseHealthy(connection)) { next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Agenda database is unavailable')); return; }
    next();
  }, createAgendaRoutes(new AgendaService(models)));
  let professionalService: ProfessionalAgendaService | undefined;
  if (professional?.settings.enabled) {
    if ((professional.eligibilityForTests || professional.nowForTests) && (process.env.NODE_ENV !== 'test' || !/^goleve_agenda56_test_/.test(connection.name))) throw new Error('Eligibility overrides are restricted to isolated automated tests');
    const provider = professional.eligibilityForTests || (professional.settings.keys && new ProfessionalEligibilityClient(professional.settings.professionalServiceUrl, professional.settings.keys));
    if (!provider) throw new Error('Dedicated Professional identity contract is required');
    professionalService = new ProfessionalAgendaService(connection, professional.models, models, provider, professional.nowForTests);
  }
  app.use('/agenda', createProfessionalAgendaRoutes(professionalService));
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found')));
  app.use(errorHandler);
  return app;
}
