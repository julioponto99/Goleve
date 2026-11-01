const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const test = require('node:test');

const mongoUri = process.env.TEST_MONGO_URI;
if (!mongoUri) throw new Error('TEST_MONGO_URI is required for the isolated integration suite');
const ownerA = new mongoose.Types.ObjectId().toHexString();
const ownerB = new mongoose.Types.ObjectId().toHexString();
const tokens = new Map([['token-a', ownerA], ['token-b', ownerB]]);
let authServer;
let serviceServer;
let connection;
let models;
let baseUrl;

function request(path, token, options = {}) {
  return fetch(`${baseUrl}${path}`, { ...options, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(options.headers || {}) } })
    .then(async (response) => ({ status: response.status, body: await response.json() }));
}

test.before(async () => {
  authServer = http.createServer((req, res) => {
    const userId = tokens.get(req.headers.authorization?.replace('Bearer ', ''));
    if (req.url !== '/auth/me' || !userId) { res.writeHead(401); res.end(); return; }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ user: { id: userId, userType: 'utilizador' } }));
  });
  await new Promise((resolve) => authServer.listen(0, '127.0.0.1', resolve));
  const { openDatabase } = require('../dist/config/database');
  const { createHydrationModels, initializeModels } = require('../dist/models');
  const { createApp } = require('../dist/server');
  connection = await openDatabase(mongoUri);
  models = createHydrationModels(connection);
  await initializeModels(models);
  const app = await createApp(`http://127.0.0.1:${authServer.address().port}`, connection, models);
  serviceServer = app.listen(0);
  baseUrl = `http://127.0.0.1:${serviceServer.address().port}`;
});

test.after(async () => {
  await connection?.close();
  await new Promise((resolve) => authServer?.close(resolve));
  await new Promise((resolve) => serviceServer?.close(resolve));
});

test('persists suggested/custom goals, history and reminders', async () => {
  const suggestion = await request('/hydration/goal/suggest', 'token-a', { method: 'POST', body: JSON.stringify({ gender: 'homem', weightKg: 80, ageYears: 40, active: true }) });
  assert.equal(suggestion.status, 200);
  assert.equal(suggestion.body.data.targetMl, 3300);
  const goal = await request('/hydration/goal', 'token-a');
  assert.equal(goal.status, 404);
  const saved = await request('/hydration/goal', 'token-a', { method: 'PUT', body: JSON.stringify({ targetMl: 2500, source: 'custom', timezone: 'Europe/Lisbon' }) });
  assert.equal(saved.status, 200);
  const changed = await request('/hydration/goal', 'token-a', { method: 'PUT', body: JSON.stringify({ targetMl: 3000, timezone: 'Europe/Lisbon', version: saved.body.data.version }) });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.data.history.length, 1);
  const reminder = await request('/hydration/reminders', 'token-a', { method: 'PUT', body: JSON.stringify({ enabled: true, frequency: 'two_hourly', startTime: '08:00', endTime: '20:00', timezone: 'Europe/Lisbon' }) });
  assert.equal(reminder.status, 200);
  assert.equal(reminder.body.data.intervalMinutes, 120);
});

test('persists idempotent intakes, local-day totals, edits, deletes and isolation', async () => {
  const first = await request('/hydration/intakes', 'token-a', { method: 'POST', body: JSON.stringify({ amountMl: 250, timezone: 'Europe/Lisbon', consumedAt: '2026-11-01T00:30:00.000Z', idempotencyKey: `synthetic-${Date.now()}-1` }) });
  assert.equal(first.status, 201);
  const duplicate = await request('/hydration/intakes', 'token-a', { method: 'POST', body: JSON.stringify({ amountMl: 500, timezone: 'Europe/Lisbon', consumedAt: '2026-11-01T00:30:00.000Z', idempotencyKey: first.body.data.idempotencyKey }) });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.data.amountMl, 250);
  const second = await request('/hydration/intakes', 'token-a', { method: 'POST', body: JSON.stringify({ amountMl: 500, timezone: 'Europe/Lisbon', consumedAt: '2026-11-01T12:00:00.000Z', idempotencyKey: `synthetic-${Date.now()}-2` }) });
  assert.equal(second.status, 201);
  const daily = await request('/hydration/intakes/daily?date=2026-11-01&timezone=Europe/Lisbon', 'token-a');
  assert.equal(daily.body.data.totalMl, 750);
  const edited = await request(`/hydration/intakes/${second.body.data.id}`, 'token-a', { method: 'PATCH', body: JSON.stringify({ amountMl: 750 }) });
  assert.equal(edited.status, 200);
  const hidden = await request(`/hydration/intakes/${first.body.data.id}`, 'token-b');
  assert.equal(hidden.status, 404);
  const deleted = await request(`/hydration/intakes/${second.body.data.id}`, 'token-a', { method: 'DELETE' });
  assert.equal(deleted.body.data.deleted, true);
});

test('rejects invalid authentication, dates, timezones and stale goal versions', async () => {
  const missing = await fetch(`${baseUrl}/hydration/goal`);
  assert.equal(missing.status, 401);
  const invalidDate = await request('/hydration/intakes/daily?date=bad&timezone=Europe/Lisbon', 'token-a');
  assert.equal(invalidDate.status, 400);
  const invalidZone = await request('/hydration/intakes', 'token-a', { method: 'POST', body: JSON.stringify({ amountMl: 250, timezone: 'Invalid/Zone', idempotencyKey: 'synthetic-invalid-1' }) });
  assert.equal(invalidZone.status, 400);
  const goal = await request('/hydration/goal', 'token-a');
  const stale = await request('/hydration/goal', 'token-a', { method: 'PUT', body: JSON.stringify({ targetMl: 2800, timezone: 'Europe/Lisbon', version: goal.body.data.version - 1 }) });
  assert.equal(stale.status, 409);
});

test('validates indexes and persists data in the isolated database', async () => {
  const [goalIndexes, intakeIndexes, reminderIndexes] = await Promise.all([models.Goal.collection.indexes(), models.Intake.collection.indexes(), models.Reminder.collection.indexes()]);
  assert.ok(goalIndexes.some((item) => item.unique && item.key.ownerId === 1));
  assert.ok(intakeIndexes.some((item) => item.unique && item.key.ownerId === 1 && item.key.idempotencyKey === 1));
  assert.ok(reminderIndexes.some((item) => item.unique && item.key.ownerId === 1));
  assert.ok(await models.Intake.countDocuments({ ownerId: ownerA }) > 0);
});
