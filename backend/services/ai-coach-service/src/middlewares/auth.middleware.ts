import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiError } from '../config/errors';
export interface RequestContext { ownerId: string; requestId: string; authorization: string; signal?: AbortSignal }
export async function verifyIdentity(origin: string, authorization: string, signal?: AbortSignal): Promise<string> {
  if (authorization.length > 4096 || !/^Bearer [^\s]+$/.test(authorization)) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Valid Bearer authentication required');
  try {
    const response = await fetch(origin + '/auth/me', { headers: { Authorization: authorization }, redirect: 'error', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(3000)]) : AbortSignal.timeout(3000) });
    if (response.status === 401 || response.status === 403) throw new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired authentication');
    if (!response.ok) throw new Error();
    const body = await response.json() as { user?: { id?: unknown } };
    if (!body.user || typeof body.user.id !== 'string' || !/^[a-f0-9]{24}$/.test(body.user.id)) throw new Error();
    // Auth verifies the signature. Enforce the existing common GoLeve API audience as well.
    const parts = authorization.slice(7).split('.');
    if (parts.length !== 3) throw new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication claims');
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    if (claims.iss !== 'goleve-auth' || claims.aud !== 'goleve-api' || claims.sub !== body.user.id || typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) throw new ApiError(401, 'INVALID_TOKEN', 'Incompatible authentication audience or identity');
    return body.user.id;
  } catch (error) { if (error instanceof ApiError) throw error; throw new ApiError(503, 'AUTH_SERVICE_UNAVAILABLE', 'Identity verification unavailable'); }
}
export function authenticate(origin: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.get('authorization') || '';
    const controller = new AbortController();
    req.once('aborted', () => controller.abort()); res.once('close', () => { if (!res.writableEnded) controller.abort(); });
    verifyIdentity(origin, authorization, controller.signal).then(ownerId => { res.locals.context = { ownerId, authorization, requestId: randomUUID(), signal: controller.signal } satisfies RequestContext; next(); }, next);
  };
}
