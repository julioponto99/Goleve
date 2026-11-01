import { ApiError } from './errors';

export interface PaymentFixture { reference: string; amountCents: number; outcome: 'approve' | 'decline' }

export function loadPaymentFixtures(raw = process.env.PAYMENT_DEMO_FIXTURES || ''): Map<string, PaymentFixture> {
  const fixtures = new Map<string, PaymentFixture>();
  if (!raw.trim()) return fixtures;
  for (const item of raw.split(',')) {
    const [reference, amount, outcome] = item.trim().split(':');
    if (!reference || !/^[a-z0-9._-]{1,80}$/.test(reference) || !/^\d+$/.test(amount || '')
      || !['approve', 'decline'].includes(outcome || '') || fixtures.has(reference)) {
      throw new Error('PAYMENT_DEMO_FIXTURES must contain reference:amountCents:approve|decline entries');
    }
    const amountCents = Number(amount);
    if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 100000000) throw new Error('Invalid payment fixture amount');
    fixtures.set(reference, { reference, amountCents, outcome: outcome as 'approve' | 'decline' });
  }
  return fixtures;
}

export function requireFixture(fixtures: Map<string, PaymentFixture>, reference: unknown, amountCents: unknown): PaymentFixture {
  if (typeof reference !== 'string' || typeof amountCents !== 'number' || !Number.isSafeInteger(amountCents)) {
    throw new ApiError(400, 'INVALID_PAYMENT', 'A valid demonstration price reference and integer amount are required');
  }
  const fixture = fixtures.get(reference);
  if (!fixture || fixture.amountCents !== amountCents) throw new ApiError(422, 'PRICE_NOT_AVAILABLE', 'The requested demonstration price is not available');
  return fixture;
}
