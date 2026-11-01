import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export function createUserProxy() {
  const target = process.env.USER_SERVICE_URL || 'http://127.0.0.1:3002';
  const url = new URL(target);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('USER_SERVICE_URL must be an HTTP(S) origin without credentials');
  }
  return createProxyMiddleware<Request, Response>({
    target, changeOrigin: true, proxyTimeout: 15000, timeout: 20000,
    pathRewrite: (_path, req) => req.originalUrl,
    on: { error: (_error, _req, res) => {
      if ('writeHead' in res && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: { code: 'USER_SERVICE_UNAVAILABLE', message: 'User service unavailable' } }));
      }
    } },
  });
}
