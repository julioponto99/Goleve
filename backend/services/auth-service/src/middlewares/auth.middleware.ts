import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { verifyAccessToken } from '../config/token';
import { SecurityService } from '../administration/security.service';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authorization = req.get('authorization');
  const match = authorization?.length && authorization.length <= 4096
    ? /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)
    : null;

  if (!match) {
    next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'A Bearer access token is required'));
    return;
  }

  void (res.app.locals.security as SecurityService||new SecurityService()).context(authorization!).then(context=>{res.locals.userId=String(context.user._id);res.locals.security=context;next();}).catch(next);
}
