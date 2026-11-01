import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../config/errors';
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  let failure: ApiError;
  if (error instanceof ApiError) failure = error;
  else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.parse.failed') failure = new ApiError(400, 'INVALID_JSON', 'Invalid JSON body');
  else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') failure = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  else if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.StrictModeError) failure = new ApiError(400, 'VALIDATION_ERROR', 'Invalid professional data');
  else if (error && typeof error === 'object' && 'code' in error && error.code === 11000) failure = new ApiError(409, 'RESOURCE_CONFLICT', 'Resource conflicts with an existing record');
  else if (error instanceof Error && /^(Mongo|MongooseServerSelection)/.test(error.name)) failure = new ApiError(503, 'DATABASE_UNAVAILABLE', 'Professional database is unavailable');
  else { console.error('professional-service request failed'); failure = new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred'); }
  res.status(failure.statusCode).json({ error: { code: failure.code, message: failure.message } });
};
