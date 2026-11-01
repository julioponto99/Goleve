import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../config/errors';

export interface RequestContext { identity: { id: string; userType: string }; requestId: string }
export function authenticate(authServiceUrl: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.get('authorization');
    if (!authorization || authorization.length > 4096 || !/^Bearer [A-Za-z0-9._~+/=-]+$/.test(authorization)) {
      next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'A valid Bearer token is required')); return;
    }
    try {
      const response = await fetch(authServiceUrl + '/auth/me', { headers: { Authorization: authorization }, signal: AbortSignal.timeout(3000), redirect: 'error' });
      if (response.status === 401 || response.status === 403) { next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired access token')); return; }
      if (!response.ok) throw new Error('Identity service unavailable');
      const body = await response.json() as { user?: { id?: unknown; userType?: unknown } };
      if (!body.user || typeof body.user.id !== 'string' || !/^[a-f0-9]{24}$/.test(body.user.id) || typeof body.user.userType !== 'string') throw new Error('Invalid identity response');
      res.locals.context = { identity: { id: body.user.id, userType: body.user.userType }, requestId: randomUUID() } satisfies RequestContext;
      next();
    } catch { next(new ApiError(503, 'AUTH_SERVICE_UNAVAILABLE', 'Identity verification is unavailable')); }
  };
}
