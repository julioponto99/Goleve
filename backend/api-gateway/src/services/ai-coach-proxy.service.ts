import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
export function createAiCoachProxy() {
  const url = new URL(process.env.AI_COACH_SERVICE_URL || 'http://127.0.0.1:3011');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('AI_COACH_SERVICE_URL must be an HTTP(S) origin without credentials');
  return createProxyMiddleware<Request, Response>({ target: url.origin, changeOrigin: true, proxyTimeout: 20000, timeout: 25000, pathRewrite: (_path, req) => req.originalUrl,
    on: { error: (_error, _req, res) => { if ('writeHead' in res && !res.headersSent) { res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: { code: 'AI_COACH_UNAVAILABLE', message: 'AI Coach service unavailable' } })); } } },
  });
}
