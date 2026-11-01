const { test } = require('node:test');
const assert = require('node:assert/strict');
const v = require('../dist/config/validation');
const h = require('../dist/config/http');
const { createConnection } = require('mongoose');
const { createUserModels } = require('../dist/models');

test('profile normalizes only personal presentation/contact fields', () => {
  assert.deepEqual(v.validateProfile({ displayName: ' Ana Silva ', contactEmail: ' CONTACT@EXAMPLE.INVALID ', countryCode: 'pt' }),
    { displayName: 'Ana Silva', contactEmail: 'contact@example.invalid', countryCode: 'PT' });
});
for (const [label, input] of [
  ['missing body', undefined], ['array', []], ['empty', {}], ['missing name', { phoneE164: '+351910000000' }],
  ['short name', { displayName: 'A' }], ['control characters', { displayName: 'Ana\nSilva' }],
  ['invalid date', { displayName: 'Ana', birthDate: '2025-02-30' }],
  ['future birth date', { displayName: 'Ana', birthDate: '2999-01-01' }],
  ['unknown gender', { displayName: 'Ana', gender: 'invented' }],
  ['invalid phone', { displayName: 'Ana', phoneE164: '910000000' }],
  ['invalid country', { displayName: 'Ana', countryCode: 'XX' }],
  ['invalid email', { displayName: 'Ana', contactEmail: 'bad' }],
  ['exact coordinates', { displayName: 'Ana', approximateLocation: { latitude: 1, longitude: 2 } }],
  ['owner injection', { displayName: 'Ana', authUserId: '507f1f77bcf86cd799439011' }],
  ['role injection', { displayName: 'Ana', userType: 'administrador' }],
  ['password', { displayName: 'Ana', password: 'never-store-me' }],
  ['login email', { displayName: 'Ana', email: 'not-a-contact@example.invalid' }],
  ['status injection', { displayName: 'Ana', profileStatus: 'active' }],
  ['timestamp injection', { displayName: 'Ana', createdAt: '2026-01-01' }],
  ['verification injection', { displayName: 'Ana', contactEmailVerifiedAt: new Date().toISOString() }],
  ['Mongo operator', { displayName: { $ne: '' } }],
  ['unimplemented photo', { displayName: 'Ana', photoAssetId: '507f1f77bcf86cd799439011' }],
]) {
  test('profile rejects ' + label, () => assert.throws(() => v.validateProfile(input), { statusCode: 400 }));
}
test('profile consistency and explicit optional-field clearing', () => {
  assert.throws(() => v.validateProfileConsistency({ gender: 'autodescrito' }), { statusCode: 400 });
  assert.throws(() => v.validateProfileConsistency({ gender: 'homem', genderDescription: 'other' }), { statusCode: 400 });
  assert.equal(v.validateProfile({ phoneE164: null }, true).phoneE164, null);
  assert.deepEqual(v.mergeFields({ displayName: 'Ana', phoneE164: '+351910000000' }, { phoneE164: null }), { displayName: 'Ana' });
});
test('preferences require an explicit time zone and reject consent/AI activation', () => {
  assert.throws(() => v.validatePreferences({ theme: 'dark' }), { statusCode: 400 });
  assert.throws(() => v.validatePreferences({ timeZone: 'Mars/Olympus' }), { statusCode: 400 });
  assert.throws(() => v.validatePreferences({ timeZone: 'UTC', coach: { enabled: true } }), { statusCode: 400 });
  assert.throws(() => v.validatePreferences({ timeZone: 'UTC', consent: true }), { statusCode: 400 });
  assert.throws(() => v.validatePreferences({ timeZone: 'UTC', notifications: { channels: { email: 'true' } } }), { statusCode: 400 });
  assert.equal(v.validatePreferences({ timeZone: 'Europe/Lisbon', locale: 'pt-pt' }).locale, 'pt-PT');
});
test('notification patches preserve unrelated preference choices', () => {
  const old = v.preferenceDefaults();
  const result = v.mergePreferences(old, v.validatePreferences({ notifications: { channels: { email: true } } }, true));
  assert.equal(result.notifications.channels.email, true);
  assert.equal(result.notifications.channels.inApp, true);
  assert.deepEqual(result.notifications.categories, old.notifications.categories);
});
for (const input of [
  { usualSleepMinutes: -1 }, { exerciseDaysPerWeek: 8 }, { activityLevel: 'unlimited' },
  { hydrationHabit: 'medical' }, { preferredTrainingWindows: Array(15).fill({}) },
  { preferredTrainingWindows: [{ day: 1, startMinute: 700, endMinute: 600, timeZone: 'UTC' }] },
  { preferredTrainingWindows: [{ day: 8, startMinute: 600, endMinute: 700, timeZone: 'UTC' }] },
  { source: 'professional', usualSleepMinutes: 400 },
]) {
  test('habits reject invalid ranges or provenance ' + JSON.stringify(input).slice(0, 60), () => {
    assert.throws(() => v.validateHabits(input), { statusCode: 400 });
  });
}
const measurement = { kind: 'weight', value: 75000, unit: 'g', measuredAt: '2026-01-01T10:00:00.000Z' };
for (const [label, patch] of [
  ['negative', { value: -1 }], ['fractional', { value: 75.5 }], ['too large', { value: 1000001 }],
  ['wrong unit', { unit: 'kg' }], ['unknown kind', { kind: 'diagnosis' }],
  ['future', { measuredAt: '2999-01-01T00:00:00.000Z' }], ['invalid timestamp', { measuredAt: '2026-02-30T00:00:00Z' }],
  ['body ownership', { authUserId: '507f1f77bcf86cd799439011' }], ['delegated source', { source: 'professional' }],
]) {
  test('measurements reject ' + label, () => assert.throws(() => v.validateMeasurement({ ...measurement, ...patch }), { statusCode: 400 }));
}
test('measurements use explicit canonical integer units', () => {
  assert.equal(v.validateMeasurement(measurement).value, 75000);
  assert.equal(v.validateMeasurement({ ...measurement, kind: 'height', value: 1750, unit: 'mm' }).value, 1750);
});
test('goal validation does not infer muscle mass or custom quantitative units', () => {
  const goal = v.validateGoal({ goalType: 'weight_loss', title: 'Synthetic goal',
    target: { metric: 'body_weight', value: 74000, unit: 'g', period: 'once' } });
  v.validateGoalConsistency(goal);
  assert.throws(() => v.validateGoalConsistency({ ...goal, goalType: 'muscle_gain' }), { statusCode: 400 });
  assert.throws(() => v.validateGoal({ goalType: 'custom', title: 'Synthetic', target: { metric: 'custom_metric', value: 1, unit: 'unapproved', period: 'day' } }), { statusCode: 400 });
  assert.throws(() => v.validateGoalConsistency({ ...goal, startsOn: '2026-12-01', targetDate: '2026-01-01' }), { statusCode: 400 });
});
test('ETags, creation preconditions and idempotency headers are explicit', () => {
  const id = '507f1f77bcf86cd799439011';
  assert.equal(h.expectedVersion(h.entityTag(id, 3), id), 3);
  assert.throws(() => h.expectedVersion(undefined, id), { statusCode: 428 });
  assert.throws(() => h.expectedVersion('*', id), { statusCode: 412 });
  assert.throws(() => h.requireCreate(undefined), { statusCode: 428 });
  assert.throws(() => h.idempotencyKey('bad key'), { statusCode: 400 });
});
test('pagination validates types, bounds, owner and filter instead of accepting query operators', () => {
  const owner = '507f1f77bcf86cd799439011';
  assert.throws(() => h.pageOptions({ kind: { $ne: '' } }, owner, 'measurements'), { statusCode: 400 });
  for (const limit of ['0', '101', '-1', '1.5']) assert.throws(() => h.pageOptions({ limit }, owner, 'measurements'), { statusCode: 400 });
  const cursor = h.nextCursor(owner, 'measurements', 'weight', new Date('2026-01-01T00:00:00Z'), owner);
  assert.throws(() => h.pageOptions({ cursor, kind: 'height' }, owner, 'measurements'), { statusCode: 400 });
  assert.throws(() => h.pageOptions({ cursor, kind: 'weight' }, '507f1f77bcf86cd799439012', 'measurements'), { statusCode: 400 });
  assert.equal(h.pageOptions({ cursor, kind: 'weight' }, owner, 'measurements').cursor.id, owner);
});
test('schemas exclude encrypted fields and forbid unknown credential fields', async () => {
  const connection = createConnection();
  try {
    const models = createUserModels(connection);
    assert.equal(models.Measurement.schema.path('value').options.select, false);
    assert.equal(models.Habit.schema.path('payloadEncrypted').options.select, false);
    assert.equal(models.Goal.schema.path('payloadEncrypted').options.select, false);
    assert.throws(() => new models.Profile({ authUserId: '507f1f77bcf86cd799439011', displayName: 'Ana', passwordHash: 'never' }));
    assert.equal(models.Profile.schema.indexes().some(([keys, options]) => keys.authUserId === 1 && options.unique), true);
  } finally { await connection.close(); }
});
