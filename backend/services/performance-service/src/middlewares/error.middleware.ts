import { ErrorRequestHandler } from 'express';
import { ApiError } from '../config/errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ApiError) { res.status(error.status).set('Cache-Control', 'no-store').json({ error: { code: error.code, message: error.message, requestId: res.locals.context?.requestId } }); return; }
  if (error?.code === 11000) { res.status(409).json({ error: { code: 'DUPLICATE_RECORD', message: 'A record with this idempotency key already exists' } }); return; }
  if (error?.name === 'ValidationError') { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } }); return; }
  if (error?.name === 'CastError') { res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid identifier' } }); return; }
  console.error('performance-service request failed', { method: req.method, path: req.path, error: error instanceof Error ? error.message : 'unknown' });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};
