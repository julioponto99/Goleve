import { PaymentFixture } from '../config/fixtures';
import { BankResult } from './mock-bank.provider';

// Providers supporting idempotency must forward this durable key to their API.
// A provider without that guarantee must still never be retried after dispatch.
export interface BankProvider {
  authorize(paymentId: string, fixture: PaymentFixture, request?: {
    idempotencyKey: string; signal: AbortSignal;
  }): Promise<BankResult>;
}
