import { Types } from 'mongoose';
import { notificationTransition, MAX_OUTBOX_EVENTS } from '../events/outbox';
import { ApiError } from '../config/errors';
import { PaymentFixture, requireFixture } from '../config/fixtures';
import { CreatePaymentInput } from '../config/validation';
import { PaymentModels } from '../models';
import { PaymentData } from '../models/payment.model';
import { MockBankProvider } from './mock-bank.provider';
import { RequestContext } from '../middlewares/auth.middleware';

const dto = (doc: PaymentData & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }) => ({
  id: doc._id.toHexString(), priceReference: doc.priceReference, serviceReference: doc.serviceReference, amountCents: doc.amountCents,
  currency: doc.currency, state: doc.state, method: doc.method, transactionReference: doc.transactionReference,
  history: doc.history, createdAt: doc.createdAt, updatedAt: doc.updatedAt,
});
export class PaymentService {
  constructor(private readonly models: PaymentModels, private readonly fixtures: Map<string, PaymentFixture>, private readonly bank = new MockBankProvider()) {}
  private own(ctx: RequestContext, id: string) {
    if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(400, 'INVALID_ID', 'Invalid payment identifier');
    return this.models.Payment.findOne({ _id: id, ownerId: ctx.identity.id });
  }
  async create(ctx: RequestContext, input: CreatePaymentInput, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(idempotencyKey)) throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key is required');
    const fixture = requireFixture(this.fixtures, input.priceReference, input.amountCents);
    const existing = await this.models.Payment.findOne({ ownerId: ctx.identity.id, idempotencyKey });
    if (existing) {
      if (existing.serviceReference !== input.serviceReference || existing.priceReference !== input.priceReference || existing.amountCents !== fixture.amountCents) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was reused with different payment data');
      return dto(existing);
    }
    const now = new Date();
    try {
      const doc = await this.models.Payment.create({ ownerId: ctx.identity.id, priceReference: input.priceReference, serviceReference: input.serviceReference, amountCents: fixture.amountCents,
        currency: 'EUR', state: 'pending', method: 'mock', idempotencyKey, history: [{ state: 'pending', occurredAt: now }] });
      return dto(doc);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const doc = await this.models.Payment.findOne({ ownerId: ctx.identity.id, idempotencyKey });
        if (doc) {
          if (doc.serviceReference === input.serviceReference && doc.priceReference === input.priceReference && doc.amountCents === fixture.amountCents) return dto(doc);
          throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key was reused with different payment data');
        }
      }
      throw error;
    }
  }
  async get(ctx: RequestContext, id: string) {
    const doc = await this.own(ctx, id);
    if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
    return dto(doc);
  }
  async list(ctx: RequestContext, limit: number, before?: string) {
    const filter = { ownerId: ctx.identity.id, ...(before ? { _id: { $lt: new Types.ObjectId(before) } } : {}) };
    const docs = await this.models.Payment.find(filter).sort({ _id: -1 }).limit(limit + 1);
    const selected = docs.slice(0, limit);
    return { items: selected.map(dto), nextBefore: docs.length > limit ? selected.at(-1)!._id.toHexString() : null };
  }
  async confirm(ctx: RequestContext, id: string, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(idempotencyKey)) throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key is required');
    const current = await this.own(ctx, id);
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
    if (current.state !== 'pending') {
      if (current.confirmationKey === idempotencyKey) return dto(current);
      throw new ApiError(409, 'INVALID_STATE', 'Only pending payments can be confirmed');
    }
    const fixture = this.fixtures.get(current.priceReference);
    if (!fixture) throw new ApiError(503, 'PRICE_NOT_AVAILABLE', 'Payment fixture is no longer available');
    if((current.notificationOutbox?.length||0)>MAX_OUTBOX_EVENTS-3)throw new ApiError(503,'NOTIFICATION_OUTBOX_FULL','Recover retained events before authorizing a bank call');
    const result = await this.bank.authorize(current._id.toHexString(), fixture);
    const nextState = result.outcome === 'approve' ? 'approved' : 'declined';
    const updated = await notificationTransition(this.models.Payment,{ _id: current._id, ownerId: ctx.identity.id, state: 'pending' },
      { $set: { state: nextState, transactionReference: result.transactionReference, confirmationKey: idempotencyKey },
        $push: { history: { state: nextState, occurredAt: new Date(), reason: 'mock_bank_result' } } }, nextState);
    if (!updated) {
      const winner = await this.get(ctx, id);
      if (winner.state === nextState) return winner;
      throw new ApiError(409, 'INVALID_STATE', 'Payment was changed concurrently');
    }
    return dto(updated);
  }
  async cancel(ctx: RequestContext, id: string, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(idempotencyKey)) throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key is required');
    const updated = await notificationTransition(this.models.Payment,{ _id: id, ownerId: ctx.identity.id, state: 'pending' },
      { $set: { state: 'cancelled', confirmationKey: idempotencyKey }, $push: { history: { state: 'cancelled', occurredAt: new Date(), reason: 'owner_cancelled' } } }, 'cancelled');
    if (!updated) {
      const current = await this.own(ctx, id);
      if (!current) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
      if (current.state === 'cancelled' && current.confirmationKey === idempotencyKey) return dto(current);
      throw new ApiError(409, 'INVALID_STATE', 'Only pending payments can be cancelled');
    }
    return dto(updated);
  }
}
