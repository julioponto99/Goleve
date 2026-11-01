import { Router } from 'express';
import { createProfessionalReviewProxy } from '../services/professional-review-proxy.service';
export function createProfessionalApplicationRoutes() {
  const router = Router();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const authorization = req.get('authorization');
    if (!authorization || authorization.length > 4096 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(authorization)) {
      res.status(401).json({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'A Bearer access token is required' } }); return;
    }
    next();
  }, createProfessionalReviewProxy());
  return router;
}
