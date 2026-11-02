import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

export const serviceOrigins = {
  auth: ['AUTH_SERVICE_URL', 3001], user: ['USER_SERVICE_URL', 3002],
  training: ['TRAINING_SERVICE_URL', 3003], agenda: ['AGENDA_SERVICE_URL', 3004],
  performance: ['PERFORMANCE_SERVICE_URL', 3005], hydration: ['HYDRATION_SERVICE_URL', 3006],
  professional: ['PROFESSIONAL_SERVICE_URL', 3007], management: ['MANAGEMENT_SERVICE_URL', 3008],
  payment: ['PAYMENT_SERVICE_URL', 3009], notification: ['NOTIFICATION_SERVICE_URL', 3010],
  coach: ['AI_COACH_SERVICE_URL', 3011],
} as const;

function origin(value: string) {
  const u = new URL(value);
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.pathname !== '/' || u.search || u.hash) throw new Error('Gateway origins must not contain paths or credentials');
  return u.origin;
}
export function publicBoundary(): RequestHandler {
  return (req, res, next) => {
    let decoded: string;
    try { decoded = decodeURIComponent(req.originalUrl.split('?')[0]); }
    catch { res.status(400).json({ error: { code: 'INVALID_PATH' } }); return; }
    if (decoded.split('/').some(part => ['internal', '.', '..'].includes(part.toLowerCase())) || /^(Service|AgendaService|DemoService) /i.test(req.get('authorization') || '')) {
      res.status(404).json({ error: { code: 'NOT_FOUND' } }); return;
    }
    for (const header of ['x-management-user-authorization', 'x-management-caller', 'x-demo-caller', 'x-payment-demo-proof']) delete req.headers[header];
    next();
  };
}
export function corsPolicy(): RequestHandler {
  const allowed = new Set((process.env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean).map(v => origin(v.trim())));
  const headers = ['authorization', 'content-type', 'if-match', 'if-none-match', 'idempotency-key', 'x-admin-step-up'];
  return (req, res, next) => {
    const incoming = req.get('origin');
    if (!incoming) { next(); return; }
    res.vary('Origin');
    if (!allowed.has(incoming)) { res.status(403).json({ error: { code: 'ORIGIN_FORBIDDEN' } }); return; }
    res.set('Access-Control-Allow-Origin', incoming);
    res.set('Access-Control-Expose-Headers', 'ETag, Idempotency-Replayed, Retry-After, RateLimit, RateLimit-Policy');
    if (req.method === 'OPTIONS') {
      const method = req.get('access-control-request-method') || '';
      const requested = (req.get('access-control-request-headers') || '').toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(method) || requested.some(h => !headers.includes(h))) { res.status(403).json({ error: { code: 'PREFLIGHT_FORBIDDEN' } }); return; }
      res.vary('Access-Control-Request-Headers');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD');
      res.set('Access-Control-Allow-Headers', headers.join(', '));
      res.set('Access-Control-Max-Age', '600');
      res.status(204).end(); return;
    }
    next();
  };
}
export function apiRateLimiter() {
  const limit = Number(process.env.GATEWAY_API_RATE_LIMIT || 300);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000) throw new Error('Invalid Gateway API rate limit');
  return rateLimit({ windowMs: 60000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    skip: req => ['/health', '/ready'].includes(req.path), validate: { xForwardedForHeader: false, forwardedHeader: false },
    handler: (_req, res) => { res.set('Cache-Control', 'no-store').status(429).json({ error: { code: 'API_RATE_LIMITED' } }); },
  });
}
export function readiness(): RequestHandler {
  const destinations = Object.entries(serviceOrigins).map(([service, [variable, port]]) => ({ service, url: origin(process.env[variable] || 'http://127.0.0.1:' + port) }));
  return (_req, res) => {
    void Promise.all(destinations.map(async d => {
      try {
        const r = await fetch(d.url + (['notification', 'management'].includes(d.service) ? '/ready' : '/health'), { redirect: 'error', signal: AbortSignal.timeout(3000) });
        await r.body?.cancel();
        return { service: d.service, status: r.ok ? 'ready' : 'unavailable' };
      } catch { return { service: d.service, status: 'unavailable' }; }
    })).then(dependencies => {
      const ready = dependencies.every(d => d.status === 'ready');
      res.set('Cache-Control', 'no-store').status(ready ? 200 : 503).json({ service: 'api-gateway', status: ready ? 'ready' : 'unavailable', dependencies });
    });
  };
}
