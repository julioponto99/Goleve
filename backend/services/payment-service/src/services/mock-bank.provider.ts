import { randomUUID } from 'node:crypto';
import { PaymentFixture } from '../config/fixtures';

export interface BankResult { outcome: 'approve' | 'decline'; transactionReference: string }
export class MockBankProvider {
  async authorize(paymentId: string, fixture: PaymentFixture): Promise<BankResult> {
    return { outcome: fixture.outcome, transactionReference: `mock_${paymentId}_${randomUUID().replaceAll('-', '')}` };
  }
}
