import express from 'express';
import { createProfessionalApplicationRoutes } from './routes/professional-applications.routes';
export function createApp() {
  const app = express(); app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ service: 'management-service', status: 'ok' }));
  // Professional is the authority: validates the current Auth role and reviewer grant on every forwarded request.
  app.use('/management/professional-applications', createProfessionalApplicationRoutes());
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
  return app;
}
