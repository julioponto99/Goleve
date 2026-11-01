import { ErrorRequestHandler } from 'express';
import { ApiError } from '../config/errors';
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ApiError) { res.status(error.status).set('Cache-Control', 'no-store').json({ error: { code: error.code, message: error.message, requestId: res.locals.context?.requestId } }); return; }
  if (error?.name === 'CastError') { res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid identifier' } }); return; }
  if (error?.name === 'ValidationError') { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } }); return; }
  console.error('training-service request failed', { method: req.method, path: req.path, error: error instanceof Error ? error.message : 'unknown' });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};
