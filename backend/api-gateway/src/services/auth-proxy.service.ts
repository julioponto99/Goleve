import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';

export function createAuthProxy() {
  const target = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001';
  const url = new URL(target);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('AUTH_SERVICE_URL must be an HTTP(S) URL');
  }

  return createProxyMiddleware<Request, Response>({
    target,
    changeOrigin: true,
    proxyTimeout: 10000,
    timeout: 12000,
    // Express removes the mount prefix; the auth-service expects the full path.
    pathRewrite: (_path, req) => req.originalUrl,
    on: {
      error: (_error, _req, res) => {
        if ('writeHead' in res && !res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({
            error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service unavailable' },
          }));
        }
      },
    },
  });
}
