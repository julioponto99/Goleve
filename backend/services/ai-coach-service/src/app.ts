import express from 'express';
import { Connection } from 'mongoose';
import { CoachSettings } from './config/settings';
import { createEncryption } from './config/encryption';
import { ApiError } from './config/errors';
import { isDatabaseHealthy } from './config/database';
import { authenticate, RequestContext } from './middlewares/auth.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { CoachModels, CATEGORIES, TOOLS } from './models';
import { CoachProvider } from './providers/provider';
import { DomainClient } from './services/domain-client';
import { CoachService } from './services/coach.service';
import { createCoachRoutes } from './routes/coach.routes';
export interface TestDependencies { provider?: CoachProvider; now?: () => Date }
export function createApp(settings: CoachSettings, connection?: Connection, models?: CoachModels, tests: TestDependencies = {}) {
  if ((tests.provider || tests.now) && (process.env.NODE_ENV !== 'test' || !/^goleve_ai_test_/.test(connection?.name || ''))) throw new Error('AI test dependencies require an isolated automated test database');
  if (settings.enabled && (!['test', 'development'].includes(process.env.NODE_ENV || '') || !connection || !models || !settings.key)) throw new Error('Enabled AI Coach requires isolated local dependencies');
  const service = settings.enabled ? new CoachService(connection!, models!, createEncryption(settings.key!), tests.provider || settings.provider, new DomainClient(settings), tests.now) : undefined;
  const app = express(); app.disable('x-powered-by'); app.disable('etag');
  app.get('/health', async (_req, res) => { const healthy = !settings.enabled || !!connection && await isDatabaseHealthy(connection); res.set('Cache-Control', 'no-store').status(healthy ? 200 : 503).json({ service: 'ai-coach-service', status: healthy ? 'ok' : 'unavailable', mode: settings.enabled ? 'isolated-synthetic' : 'disabled', provider: settings.provider.name }); });
  const rates = new Map<string, { until: number; count: number }>();
  app.use('/ai-coach', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, authenticate(settings.authOrigin), express.json({ limit: '16kb' }), async (_req, res, next) => {
    if (!service) { next(new ApiError(503, 'AI_COACH_DISABLED', 'AI Coach is disabled')); return; }
    const ctx = res.locals.context as RequestContext, now = Date.now();
    for (const [owner, bucket] of rates) if (bucket.until <= now) rates.delete(owner);
    if (!rates.has(ctx.ownerId) && rates.size >= 1000) { next(new ApiError(429, 'RATE_LIMITED', 'Coach capacity reached')); return; }
    const bucket = rates.get(ctx.ownerId) || { until: now + 60000, count: 0 }; bucket.count++; rates.set(ctx.ownerId, bucket);
    if (bucket.count > 120) { next(new ApiError(429, 'RATE_LIMITED', 'Coach request limit reached')); return; }
    try { if (!await isDatabaseHealthy(connection!)) throw new ApiError(503, 'DATABASE_UNAVAILABLE', 'Coach database unavailable'); await service.purgeExpired(ctx.ownerId); next(); } catch (error) { next(error); }
  });
  if (service) {
    app.get('/ai-coach/capabilities', (_req, res) => res.json({ data: { categories: CATEGORIES, tools: TOOLS, mode: 'isolated-synthetic', conversationRetentionDays: 7, auditRetentionDays: 30, proposalLifetimeSeconds: 600 } }));
    app.use('/ai-coach', createCoachRoutes(service));
  }
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Endpoint not found'))); app.use(errorHandler);
  return app;
}
