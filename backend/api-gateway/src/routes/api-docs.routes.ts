import { Router } from 'express';
import { dirname, join } from 'node:path';
import { initializeSwaggerUi } from '../docs/swagger-bootstrap';

interface DocsSettings { tryItOut: boolean; origin?: string }
function settings(env: NodeJS.ProcessEnv): DocsSettings | undefined {
  // Production/unknown environments cannot expose docs, even with both flags set.
  if (env.NODE_ENV !== 'development') return;
  const flag = (name: string) => {
    const value = env[name] || 'false';
    if (!['true', 'false'].includes(value)) throw new Error('Invalid Gateway documentation flag: ' + name);
    return value === 'true';
  };
  const enabled = flag('GATEWAY_API_DOCS_ENABLED'), tryItOut = flag('GATEWAY_API_DOCS_TRY_IT_OUT');
  if (!enabled) {
    if (tryItOut) throw new Error('Try it out requires explicitly enabled development documentation');
    return;
  }
  if (!tryItOut) return { tryItOut: false };
  let origin: URL;
  try { origin = new URL(env.GATEWAY_API_DOCS_ORIGIN || ''); }
  catch { throw new Error('Try it out requires an explicit loopback Gateway origin'); }
  if (!['http:', 'https:'].includes(origin.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
    || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Try it out requires a loopback HTTP(S) origin without credentials or paths');
  }
  const allowed = (env.CORS_ALLOWED_ORIGINS || '').split(',').filter(Boolean).map(value => new URL(value.trim()).origin);
  if (!allowed.includes(origin.origin)) throw new Error('The Swagger Gateway origin must be explicitly allowed by CORS');
  return { tryItOut: true, origin: origin.origin };
}

export function createApiDocsRoutes() {
  const router = Router(), config = settings(process.env);
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const notFound = (_req: unknown, res: import('express').Response) => { res.status(404).json({ error: { code: 'NOT_FOUND' } }); };
  if (!config) { router.use(notFound); return router; }
  router.use((req, res, next) => {
    if (config.origin && req.protocol + '://' + req.get('host') !== config.origin) {
      res.status(403).json({ error: { code: 'API_DOCS_ORIGIN_FORBIDDEN' } }); return;
    }
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self' data:; worker-src 'self' blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    });
    next();
  });
  // Lazy loading keeps the document and UI assets out of disabled/production startup.
  const { apiDocsDocument } = require('../generated/api-docs-document') as {
    apiDocsDocument: { paths: Record<string, Record<string, unknown>> };
  };
  const operations = Object.entries(apiDocsDocument.paths).flatMap(([path, methods]) => Object.keys(methods).map(method => ({ method, path })));
  const bootstrap = '(' + initializeSwaggerUi.toString() + ')(' + JSON.stringify({ tryItOut: config.tryItOut, operations }) + ');';
  const assets = dirname(require.resolve('swagger-ui-dist/package.json'));
  router.get('/', (_req, res) => { res.type('html').send('<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GoLeve V1 — API de desenvolvimento</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/api-docs/swagger-ui.css"></head><body><p>GoLeve V1 — desenvolvimento fictício. Try it out: ' + (config.tryItOut ? 'ativado; as APIs mantêm autenticação e permissões.' : 'desativado.') + '</p><div id="swagger-ui"></div><script src="/api-docs/swagger-ui-bundle.js"></script><script src="/api-docs/init.js"></script></body></html>'); });
  router.get('/openapi.json', (_req, res) => { res.json(apiDocsDocument); });
  router.get('/init.js', (_req, res) => { res.type('application/javascript').send(bootstrap); });
  for (const file of ['swagger-ui-bundle.js', 'swagger-ui.css']) router.get('/' + file, (_req, res) => { res.sendFile(join(assets, file)); });
  router.use(notFound);
  return router;
}
