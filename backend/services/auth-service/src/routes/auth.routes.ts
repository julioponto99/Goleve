import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireDatabase } from '../middlewares/database.middleware';

const router = Router();
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
router.post('/register', requireDatabase, controller.register);
router.post('/login', requireDatabase, controller.login);
router.get('/me', authenticate, requireDatabase, controller.me);

export default router;
