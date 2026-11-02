import { HydratedDocument, Schema } from 'mongoose';
import { outboxFields } from '../events/outbox';

export const PAYMENT_STATES = ['pending', 'approved', 'declined', 'cancelled'] as const;
export interface PaymentHistory { state: typeof PAYMENT_STATES[number]; occurredAt: Date; reason?: string }
export interface BankAttempt {
  claimId: string; providerKey: string; status: 'processing' | 'unknown' | 'settled';
  startedAt: Date; deadlineAt: Date;
}
export interface PaymentData {
  notificationVersion?: number; notificationOutbox?: unknown[];
  ownerId: string; priceReference: string; serviceReference: string; amountCents: number; currency: 'EUR'; state: typeof PAYMENT_STATES[number];
  method: 'mock'; transactionReference?: string; idempotencyKey: string; confirmationKey?: string;
  bankAttempt?: BankAttempt;
  history: PaymentHistory[]; createdAt: Date; updatedAt: Date;
}
const historySchema = new Schema<PaymentHistory>({ state: { type: String, enum: PAYMENT_STATES, required: true }, occurredAt: { type: Date, required: true }, reason: { type: String, maxlength: 120 } }, { _id: false, strict: 'throw' });
const bankAttemptSchema = new Schema<BankAttempt>({
  claimId: { type: String, required: true, maxlength: 36 },
  providerKey: { type: String, required: true, maxlength: 100 },
  status: { type: String, required: true, enum: ['processing', 'unknown', 'settled'] },
  startedAt: { type: Date, required: true }, deadlineAt: { type: Date, required: true },
}, { _id: false, strict: 'throw' });
export const paymentSchema = new Schema<PaymentData>({
  ownerId: { type: String, required: true, immutable: true, match: /^[a-f0-9]{24}$/ },
  priceReference: { type: String, required: true, immutable: true, maxlength: 80 },
  serviceReference: { type: String, required: true, immutable: true, maxlength: 120 },
  amountCents: { type: Number, required: true, min: 1, max: 100000000, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, required: true, enum: ['EUR'], immutable: true, default: 'EUR' },
  state: { type: String, required: true, enum: PAYMENT_STATES, default: 'pending' },
  method: { type: String, required: true, enum: ['mock'], immutable: true, default: 'mock' },
  transactionReference: { type: String, maxlength: 100 },
  idempotencyKey: { type: String, required: true, immutable: true, maxlength: 128 },
  confirmationKey: { type: String, maxlength: 128 },
  bankAttempt: { type: bankAttemptSchema, required: false },
  history: { type: [historySchema], required: true, default: [] },
}, { timestamps: true, versionKey: false, strict: 'throw', collection: 'payments' });
paymentSchema.add(outboxFields);
paymentSchema.index({'notificationOutbox.status':1,'notificationOutbox.nextAttemptAt':1});
paymentSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true });
paymentSchema.index({ ownerId: 1, createdAt: -1, _id: -1 });
paymentSchema.index({ ownerId: 1, confirmationKey: 1 }, { unique: true, sparse: true });
export type PaymentDocument = HydratedDocument<PaymentData>;
