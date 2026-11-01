const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadPaymentFixtures, requireFixture } = require('../dist/config/fixtures');
const { validateCreate } = require('../dist/config/validation');
const { MockBankProvider } = require('../dist/services/mock-bank.provider');

test('fixtures are backend-controlled and mock bank outcomes are deterministic', async () => {
  const fixtures = loadPaymentFixtures('demo-training:2500:approve,demo-decline:999:decline');
  assert.equal(requireFixture(fixtures, 'demo-training', 2500).outcome, 'approve');
  assert.equal(requireFixture(fixtures, 'demo-decline', 999).outcome, 'decline');
  assert.throws(() => requireFixture(fixtures, 'demo-training', 1), { status: 422 });
  const result = await new MockBankProvider().authorize('507f1f77bcf86cd799439011', fixtures.get('demo-training'));
  assert.equal(result.outcome, 'approve');
  assert.match(result.transactionReference, /^mock_507f1f77bcf86cd799439011_/);
});

test('payment input rejects client-controlled fields and invalid amounts', () => {
  assert.deepEqual(validateCreate({ priceReference: 'demo-training', amountCents: 2500, serviceReference: 'service-1' }),
    { priceReference: 'demo-training', amountCents: 2500, serviceReference: 'service-1' });
  for (const body of [
    { priceReference: 'demo-training', amountCents: 25.5, serviceReference: 'service-1' },
    { priceReference: 'demo-training', amountCents: 2500, serviceReference: 'service-1', state: 'approved' },
    { priceReference: 'demo-training', amountCents: -1, serviceReference: 'service-1' },
  ]) assert.throws(() => validateCreate(body), { status: 400 });
});

test('payment application refuses to start outside explicit local demo mode', async () => {
  const { createApp } = require('../dist/server');
  const old = { NODE_ENV: process.env.NODE_ENV, PAYMENT_DEMO_ENABLED: process.env.PAYMENT_DEMO_ENABLED };
  try {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_DEMO_ENABLED = 'true';
    await assert.rejects(() => createApp('http://127.0.0.1:3001', {}, {}), /local demonstration mode/);
  } finally {
    if (old.NODE_ENV === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = old.NODE_ENV;
    if (old.PAYMENT_DEMO_ENABLED === undefined) delete process.env.PAYMENT_DEMO_ENABLED; else process.env.PAYMENT_DEMO_ENABLED = old.PAYMENT_DEMO_ENABLED;
  }
});
