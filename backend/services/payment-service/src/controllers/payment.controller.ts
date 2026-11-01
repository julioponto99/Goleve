import { NextFunction, Request, Response } from 'express';
import { pagination, validateCreate } from '../config/validation';
import { PaymentService } from '../services/payment.service';
import { RequestContext } from '../middlewares/auth.middleware';

export function createPaymentController(service: PaymentService) {
  const context = (res: Response) => res.locals.context as RequestContext;
  const run = (work: (req: Request, res: Response) => Promise<unknown>, status = 200) => (req: Request, res: Response, next: NextFunction) => { work(req, res).then((data) => res.status(status).json({ data })).catch(next); };
  return {
    create: run(async (req, res) => service.create(context(res), validateCreate(req.body), req.get('idempotency-key') || ''), 201),
    get: run(async (req, res) => service.get(context(res), req.params.paymentId)),
    list: run(async (req, res) => { const page = pagination(req.query); return service.list(context(res), page.limit, page.before); }),
    confirm: run(async (req, res) => service.confirm(context(res), req.params.paymentId, req.get('idempotency-key') || '')),
    cancel: run(async (req, res) => service.cancel(context(res), req.params.paymentId, req.get('idempotency-key') || '')),
  };
}
