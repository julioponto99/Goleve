import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
export function createTrainingProxy() {
  const target = process.env.TRAINING_SERVICE_URL || 'http://127.0.0.1:3003';
  const url = new URL(target);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('TRAINING_SERVICE_URL must be an HTTP(S) origin without credentials');
  return createProxyMiddleware<Request, Response>({ target, changeOrigin: true, proxyTimeout: 15000, timeout: 20000,
    pathRewrite: (_path, req) => req.originalUrl,
    on: { error: (_error, _req, res) => {
      if ('writeHead' in res && !res.headersSent) { res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: { code: 'TRAINING_SERVICE_UNAVAILABLE', message: 'Training service unavailable' } })); }
    } },
  });
}
