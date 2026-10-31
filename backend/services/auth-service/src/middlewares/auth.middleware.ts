import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { verifyAccessToken } from '../config/token';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.get('authorization');
  const match = authorization?.length && authorization.length <= 4096
    ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)
    : null;

  if (!match) {
    next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'A Bearer access token is required'));
    return;
  }

  try {
    res.locals.userId = verifyAccessToken(match[1]);
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired access token'));
  }
}
