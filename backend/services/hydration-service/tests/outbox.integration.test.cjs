const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const test = require('node:test');

const uri = process.env.TEST_MONGO_URI;
if (!uri) throw new Error('TEST_MONGO_URI is required');
process.env.OUTBOX_ENABLED = 'true';
let connection;
let models;
let service;
const ownerId = new mongoose.Types.ObjectId().toHexString();
const context = { identity: { id: ownerId, userType: 'utilizador' }, requestId: 'synthetic' };

test.before(async () => {
  const { openDatabase } = require('../dist/config/database');
  const { createHydrationModels, initializeModels } = require('../dist/models');
  const { HydrationService } = require('../dist/services/hydration.service');
  connection = await openDatabase(uri);
  models = createHydrationModels(connection);
  await initializeModels(models);
  service = new HydrationService(models, () => new Date('2026-11-01T12:00:00.000Z'));
  await models.Goal.create({ ownerId, targetMl: 500, source: 'custom', timezone: 'Europe/Lisbon', version: 1, history: [] });
});
test.after(async () => { await connection?.close(); });

test('commits intake and daily-goal outbox event atomically', async () => {
  const result = await service.createIntake(context, { amountMl: 500, timezone: 'Europe/Lisbon', idempotencyKey: `hydration-outbox-${Date.now()}` });
  assert.equal(result.created, true);
  assert.equal(await models.Intake.countDocuments({ ownerId }), 1);
  assert.equal(await models.Outbox.countDocuments({ eventType: 'hydration.daily_goal.reached.v1' }), 1);
  assert.equal((await models.Outbox.findOne({ eventType: 'hydration.daily_goal.reached.v1' })).recipientUserId, ownerId);
});

test('does not duplicate daily-goal event for repeated qualifying intake', async () => {
  await service.createIntake(context, { amountMl: 250, timezone: 'Europe/Lisbon', idempotencyKey: `hydration-outbox-${Date.now()}-2` });
  assert.equal(await models.Outbox.countDocuments({ eventType: 'hydration.daily_goal.reached.v1' }), 1);
});
