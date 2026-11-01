import { Router } from 'express';
import { createPaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
export function createPaymentRoutes(service: PaymentService) {
  const router = Router(), controller = createPaymentController(service);
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:paymentId', controller.get);
  router.post('/:paymentId/confirm', controller.confirm);
  router.post('/:paymentId/cancel', controller.cancel);
  return router;
}
