import { rateLimit } from 'express-rate-limit';

export function createAuthRateLimiter(limit = 30) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // The gateway is the public entrypoint and does not trust client-supplied IP headers.
    validate: { xForwardedForHeader: false, forwardedHeader: false },
    handler: (_req, res) => {
      res.set('Cache-Control', 'no-store');
      res.status(429).json({
        error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts; try again later' },
      });
    },
  });
}
