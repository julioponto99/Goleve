import { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError } from '../config/errors';

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let apiError: ApiError;
  if (error instanceof ApiError) {
    apiError = error;
  } else if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
    apiError = new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'Email already registered');
  } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.parse.failed') {
    apiError = new ApiError(400, 'INVALID_JSON', 'Invalid JSON body');
  } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
    apiError = new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body too large');
  } else if (error instanceof mongoose.Error.ValidationError) {
    apiError = new ApiError(400, 'VALIDATION_ERROR', 'Invalid authentication data');
  } else if (error instanceof Error && /^(MongoNetwork|MongoServerSelection|MongooseServerSelection)/.test(error.name)) {
    apiError = new ApiError(503, 'DATABASE_UNAVAILABLE', 'Authentication database unavailable');
  } else {
    console.error('auth-service request failed');
    apiError = new ApiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  res.status(apiError.statusCode).json({ error: { code: apiError.code, message: apiError.message } });
};
