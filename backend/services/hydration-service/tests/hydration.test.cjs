const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const test = require('node:test');

const { calculateSuggestedGoal } = require('../dist/services/hydration.service');
const { goalSchema, } = require('../dist/models/goal.model');
const { intakeSchema } = require('../dist/models/intake.model');
const { reminderSchema } = require('../dist/models/reminder.model');

const owner = '507f1f77bcf86cd799439011';

test('calculates suggested goal with gender, age and activity rules', () => {
  assert.deepEqual(calculateSuggestedGoal({ gender: 'homem', weightKg: 80, ageYears: 40, active: true }), {
    targetMl: 3300, liters: 3.3, cups: 13.2,
    assumptions: { gender: 'homem', weightKg: 80, ageYears: 40, active: true, ageReductionApplied: false },
  });
  assert.equal(calculateSuggestedGoal({ gender: 'mulher', weightKg: 60, ageYears: 60, active: false }).targetMl, 1710);
});

test('schemas enforce goal, intake and reminder invariants', async () => {
  const goal = new mongoose.Document({ ownerId: owner, targetMl: 2500, source: 'custom', timezone: 'Europe/Lisbon', version: 1, history: [] }, goalSchema);
  const intake = new mongoose.Document({ ownerId: owner, amountMl: 250, consumedAt: new Date(), timezone: 'Europe/Lisbon', localDate: '2026-11-01', idempotencyKey: 'synthetic-key-1' }, intakeSchema);
  const reminder = new mongoose.Document({ ownerId: owner, enabled: true, frequency: 'hourly', intervalMinutes: 60, startTime: '08:00', endTime: '20:00', timezone: 'Europe/Lisbon', version: 1 }, reminderSchema);
  await Promise.all([goal.validate(), intake.validate(), reminder.validate()]);
  const invalid = new mongoose.Document({ ownerId: owner, amountMl: 0, consumedAt: new Date(), timezone: 'Invalid/Zone', localDate: 'bad', idempotencyKey: 'x' }, intakeSchema);
  await assert.rejects(() => invalid.validate());
});

test('gateway forwards hydration requests and authorization', async () => {
  const received = await new Promise((resolve) => {
    const upstream = http.createServer((req, res) => {
      resolve({ url: req.url, authorization: req.headers.authorization });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { targetMl: 2500 } }));
    });
    upstream.listen(0, () => {
      process.env.HYDRATION_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
      const { createApp } = require('../../../api-gateway/dist/app');
      const gateway = http.createServer(createApp());
      gateway.listen(0, async () => {
        const response = await fetch(`http://127.0.0.1:${gateway.address().port}/hydration/goal?page=1`, { headers: { authorization: 'Bearer synthetic-token' } });
        assert.equal(response.status, 200);
        gateway.close(() => upstream.close());
      });
    });
  });
  assert.deepEqual(received, { url: '/hydration/goal?page=1', authorization: 'Bearer synthetic-token' });
});
