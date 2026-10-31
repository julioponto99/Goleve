import { NextFunction, Request, Response } from 'express';
import { isDatabaseHealthy } from '../config/database';
import { ApiError } from '../config/errors';

export async function requireDatabase(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!await isDatabaseHealthy()) {
    next(new ApiError(503, 'DATABASE_UNAVAILABLE', 'Authentication database unavailable'));
    return;
  }
  next();
}
