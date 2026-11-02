import { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { notificationTransition, MAX_OUTBOX_EVENTS } from '../events/outbox';
import { ApiError } from '../config/errors';
import { PaymentFixture, requireFixture } from '../config/fixtures';
import { CreatePaymentInput } from '../config/validation';
import { PaymentModels } from '../models';
import { PaymentData, PaymentDocument } from '../models/payment.model';
import { MockBankProvider } from './mock-bank.provider';
import { BankProvider } from './bank-provider';
import { RequestContext } from '../middlewares/auth.middleware';

const dto = (doc: PaymentData & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date }) => ({
  id: doc._id.toHexString(), priceReference: doc.priceReference, serviceReference: doc.serviceReference, amountCents: doc.amountCents,
  currency: doc.currency, state: doc.state, method: doc.method, transactionReference: doc.transactionReference,
  history: doc.history, createdAt: doc.createdAt, updatedAt: doc.updatedAt,
  ...(doc.bankAttempt?.status === 'processing' ? { confirmationStatus: 'processing' } : {}),
  ...(doc.bankAttempt?.status === 'unknown' ? { confirmationStatus: 'reconciliation_required', reconciliationRequired: true } : {}),
});
export class PaymentService {
  constructor(private readonly models: PaymentModels, private readonly fixtures: Map<string, PaymentFixture>,
    private readonly bank: BankProvider = new MockBankProvider(),
    private readonly options: { bankTimeoutMs?: number; now?: () => Date } = {}) {
    const timeout = options.bankTimeoutMs ?? 2000;
    if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60000) throw new Error('Invalid bank timeout');
  }
  private now() { return this.options.now?.() ?? new Date(); }
  private confirmationError(current: PaymentDocument): never {
    if (current.bankAttempt?.status === 'unknown') throw new ApiError(503, 'PAYMENT_RECONCILIATION_REQUIRED', 'Bank outcome is uncertain; confirmation cannot be retried');
    if (current.bankAttempt) throw new ApiError(409, 'PAYMENT_PROCESSING', 'Payment confirmation is already claimed');
    throw new ApiError(409, 'INVALID_STATE', 'Payment was changed concurrently');
  }
  // Expiry fences dispatch permanently. It never grants another worker the right to call the bank.
  private async recoverInterrupted(current: PaymentDocument) {
    if (current.state === 'pending' && current.bankAttempt?.status === 'processing' && current.bankAttempt.deadlineAt <= this.now()) {
      return await this.markUnknown(current) ?? await this.models.Payment.findById(current._id) ?? current;
    }
    return current;
  }
  private markUnknown(current: PaymentDocument) {
    return notificationTransition(this.models.Payment, { _id: current._id, ownerId: current.ownerId, state: 'pending',
      'bankAttempt.claimId': current.bankAttempt!.claimId, 'bankAttempt.status': 'processing' }, {
      $set: { 'bankAttempt.status': 'unknown' },
      $push: { history: { state: 'pending', occurredAt: this.now(), reason: 'bank_outcome_unknown' } },
    }, 'unknown') as Promise<PaymentDocument | null>;
  }
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
    return dto(await this.recoverInterrupted(doc));
  }
  async list(ctx: RequestContext, limit: number, before?: string) {
    const filter = { ownerId: ctx.identity.id, ...(before ? { _id: { $lt: new Types.ObjectId(before) } } : {}) };
    const docs = await this.models.Payment.find(filter).sort({ _id: -1 }).limit(limit + 1);
    const selected = docs.slice(0, limit);
    return { items: await Promise.all(selected.map(async doc => dto(await this.recoverInterrupted(doc)))), nextBefore: docs.length > limit ? selected.at(-1)!._id.toHexString() : null };
  }
  async confirm(ctx: RequestContext, id: string, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(idempotencyKey)) throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key is required');
    const owned = await this.own(ctx, id);
    if (!owned) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
    const current = await this.recoverInterrupted(owned);
    if (current.state !== 'pending') {
      if (current.confirmationKey === idempotencyKey) return dto(current);
      throw new ApiError(409, 'INVALID_STATE', 'Only pending payments can be confirmed');
    }
    if (current.bankAttempt) this.confirmationError(current);
    const fixture = this.fixtures.get(current.priceReference);
    if (!fixture) throw new ApiError(503, 'PRICE_NOT_AVAILABLE', 'Payment fixture is no longer available');
    if((current.notificationOutbox?.length||0)>MAX_OUTBOX_EVENTS-3)throw new ApiError(503,'NOTIFICATION_OUTBOX_FULL','Recover retained events before authorizing a bank call');
    const timeoutMs = this.options.bankTimeoutMs ?? 2000, now = this.now();
    const providerKey = 'goleve:payment:' + current._id.toHexString();
    let claimed: PaymentDocument | null;
    try {
      claimed = await this.models.Payment.findOneAndUpdate({ _id: current._id, ownerId: ctx.identity.id, state: 'pending',
        bankAttempt: { $exists: false }, $expr: { $lte: [{ $size: { $ifNull: ['$notificationOutbox', []] } }, MAX_OUTBOX_EVENTS - 3] } }, {
        $set: { confirmationKey: idempotencyKey, bankAttempt: { claimId: randomUUID(), providerKey, status: 'processing',
          startedAt: now, deadlineAt: new Date(now.getTime() + timeoutMs) } },
        $push: { history: { state: 'pending', occurredAt: now, reason: 'bank_claim_acquired' } },
      }, { returnDocument: 'after', runValidators: true, writeConcern: { w: 'majority' } });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Confirmation key is already assigned');
      throw error; // An uncertain MongoDB acknowledgement must never dispatch a bank call.
    }
    if (!claimed) {
      const ownedLatest = await this.own(ctx, id);
      if (!ownedLatest) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
      const latest = await this.recoverInterrupted(ownedLatest);
      if (latest.state !== 'pending' && latest.confirmationKey === idempotencyKey) return dto(latest);
      this.confirmationError(latest);
    }
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // A paused worker must check the durable deadline again before dispatch.
      if (claimed.bankAttempt!.deadlineAt <= this.now()) throw new Error('Bank dispatch deadline elapsed');
      const result = await Promise.race([
        Promise.resolve().then(() => {
          if (controller.signal.aborted || claimed.bankAttempt!.deadlineAt <= this.now()) throw new Error('Bank dispatch deadline elapsed');
          return this.bank.authorize(id, fixture, { idempotencyKey: providerKey, signal: controller.signal });
        }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Bank outcome unknown')); }, timeoutMs); }),
      ]);
      if (!result || !['approve', 'decline'].includes(result.outcome) || typeof result.transactionReference !== 'string'
        || !/^mock_[A-Za-z0-9_:-]{1,95}$/.test(result.transactionReference)) throw new Error('Invalid bank receipt');
      const nextState = result.outcome === 'approve' ? 'approved' : 'declined';
      const updated = await notificationTransition(this.models.Payment, { _id: claimed._id, ownerId: ctx.identity.id, state: 'pending',
        'bankAttempt.claimId': claimed.bankAttempt!.claimId, 'bankAttempt.status': 'processing', 'bankAttempt.deadlineAt': { $gt: this.now() } }, {
        $set: { state: nextState, transactionReference: result.transactionReference, 'bankAttempt.status': 'settled' },
        $push: { history: { state: nextState, occurredAt: this.now(), reason: 'mock_bank_result' } },
      }, nextState);
      if (!updated) throw new Error('Confirmation cannot be settled');
      return dto(updated);
    } catch {
      // Never release/reacquire this claim, even if dispatch may not have happened.
      // The bank may have completed before a timeout, process exit or persistence failure.
      await this.markUnknown(claimed).catch(() => null);
      const latest = await this.models.Payment.findById(claimed._id).catch(() => null);
      if (latest && latest.state !== 'pending' && latest.confirmationKey === idempotencyKey) return dto(latest);
      throw new ApiError(503, 'PAYMENT_RECONCILIATION_REQUIRED', 'Bank outcome is uncertain; confirmation cannot be retried');
    } finally { if (timer) clearTimeout(timer); }
  }
  async cancel(ctx: RequestContext, id: string, idempotencyKey: string) {
    if (!/^[A-Za-z0-9._-]{1,128}$/.test(idempotencyKey)) throw new ApiError(400, 'INVALID_IDEMPOTENCY_KEY', 'A valid Idempotency-Key is required');
    const owned = await this.own(ctx, id);
    if (!owned) throw new ApiError(404, 'NOT_FOUND', 'Payment not found');
    const current = await this.recoverInterrupted(owned);
    if (current.state === 'pending' && current.bankAttempt) this.confirmationError(current);
    const updated = await notificationTransition(this.models.Payment,{ _id: id, ownerId: ctx.identity.id, state: 'pending', bankAttempt: { $exists: false } },
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
