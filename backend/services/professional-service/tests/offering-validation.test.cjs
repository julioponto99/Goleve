const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateService } = require('../dist/config/service-validation');

const capabilityId = '507f1f77bcf86cd799439011';
const valid = { capabilityId, category: 'personal_trainer', name: 'Treino funcional', description: 'Sessao demonstrativa',
  priceEur: 25.5, durationMinutes: 45, bufferBeforeMinutes: 5, bufferAfterMinutes: 10 };

test('professional service validation accepts supported synthetic offering values', () => {
  assert.deepEqual(validateService(valid), valid);
  assert.deepEqual(validateService({ name: 'Nova sessão', priceEur: 10 }, true), { name: 'Nova sessão', priceEur: 10 });
});

test('professional service validation rejects arbitrary categories, durations, prices and empty patches', () => {
  for (const patch of [
    { ...valid, category: 'doctor' }, { ...valid, durationMinutes: 40 },
    { ...valid, priceEur: -1 }, { ...valid, priceEur: 1000.01 },
    { ...valid, bufferBeforeMinutes: 121 }, {},
  ]) assert.throws(() => validateService(patch), { statusCode: 400 });
  assert.throws(() => validateService({}, true), { statusCode: 400 });
});
