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
  const { createPerformanceModels, initializeModels } = require('../dist/models');
  const { createApp } = require('../dist/server');
  connection = await openDatabase(mongoUri);
  models = createPerformanceModels(connection);
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

test('persists measurements, evolution and ownership isolation', async () => {
  const first = await request('/performance/measurements', 'token-a', { method: 'POST', body: JSON.stringify({ kind: 'weight', value: 80, timezone: 'Europe/Lisbon', measuredAt: '2026-10-01T10:00:00.000Z', idempotencyKey: `measurement-${Date.now()}-1` }) });
  assert.equal(first.status, 201);
  const second = await request('/performance/measurements', 'token-a', { method: 'POST', body: JSON.stringify({ kind: 'weight', value: 78, timezone: 'Europe/Lisbon', measuredAt: '2026-11-01T10:00:00.000Z', idempotencyKey: `measurement-${Date.now()}-2` }) });
  assert.equal(second.status, 201);
  const duplicate = await request('/performance/measurements', 'token-a', { method: 'POST', body: JSON.stringify({ kind: 'weight', value: 50, timezone: 'Europe/Lisbon', idempotencyKey: first.body.data.idempotencyKey }) });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.data.value, 80);
  const evolution = await request('/performance/measurements/evolution', 'token-a');
  assert.equal(evolution.body.data.items[0].change, -2);
  const hidden = await request(`/performance/measurements/${first.body.data.id}`, 'token-b', { method: 'PATCH', body: JSON.stringify({ value: 1 }) });
  assert.equal(hidden.status, 404);
  const updated = await request(`/performance/measurements/${second.body.data.id}`, 'token-a', { method: 'PATCH', body: JSON.stringify({ value: 77 }) });
  assert.equal(updated.status, 200);
  assert.equal((await request(`/performance/measurements/${second.body.data.id}`, 'token-a', { method: 'DELETE' })).body.data.deleted, true);
});

test('persists steps, timezone daily totals, summaries, goals and heart-rate trends', async () => {
  const first = await request('/performance/steps', 'token-a', { method: 'POST', body: JSON.stringify({ count: 4000, timezone: 'Europe/Lisbon', recordedAt: '2026-11-01T00:30:00.000Z', idempotencyKey: `steps-${Date.now()}-1` }) });
  const second = await request('/performance/steps', 'token-a', { method: 'POST', body: JSON.stringify({ count: 6000, timezone: 'Europe/Lisbon', recordedAt: '2026-11-01T12:00:00.000Z', idempotencyKey: `steps-${Date.now()}-2` }) });
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  const daily = await request('/performance/steps/daily?date=2026-11-01&timezone=Europe/Lisbon', 'token-a');
  assert.equal(daily.body.data.total, 10000);
  const goal = await request('/performance/goals/steps', 'token-a', { method: 'PUT', body: JSON.stringify({ target: 10000, timezone: 'Europe/Lisbon' }) });
  assert.equal(goal.status, 200);
  assert.equal((await request('/performance/steps/daily?date=2026-11-01&timezone=Europe/Lisbon', 'token-a')).body.data.percentage, 100);
  const heart1 = await request('/performance/heart-rate', 'token-a', { method: 'POST', body: JSON.stringify({ bpm: 70, timezone: 'Europe/Lisbon', measuredAt: '2026-11-01T09:00:00.000Z', context: 'rest', idempotencyKey: `heart-${Date.now()}-1` }) });
  const heart2 = await request('/performance/heart-rate', 'token-a', { method: 'POST', body: JSON.stringify({ bpm: 80, timezone: 'Europe/Lisbon', measuredAt: '2026-11-01T10:00:00.000Z', idempotencyKey: `heart-${Date.now()}-2` }) });
  assert.equal(heart1.status, 201); assert.equal(heart2.status, 201);
  const trend = await request('/performance/heart-rate/summary', 'token-a');
  assert.equal(trend.body.data.average, 75); assert.equal(trend.body.data.trend, 10);
});

test('rejects invalid authentication, dates, timezones and stale goal versions', async () => {
  assert.equal((await fetch(`${baseUrl}/performance/summary`)).status, 401);
  assert.equal((await request('/performance/steps/daily?date=bad&timezone=Europe/Lisbon', 'token-a')).status, 400);
  assert.equal((await request('/performance/steps', 'token-a', { method: 'POST', body: JSON.stringify({ count: 1, timezone: 'Invalid/Zone', idempotencyKey: 'steps-invalid' }) })).status, 400);
  const goal = await request('/performance/goals/steps', 'token-a', { method: 'PUT', body: JSON.stringify({ target: 12000, timezone: 'Europe/Lisbon' }) });
  const concurrent = await Promise.all([
    request('/performance/goals/steps', 'token-a', { method: 'PUT', body: JSON.stringify({ target: 12001, timezone: 'Europe/Lisbon', version: goal.body.data.version }) }),
    request('/performance/goals/steps', 'token-a', { method: 'PUT', body: JSON.stringify({ target: 12002, timezone: 'Europe/Lisbon', version: goal.body.data.version }) }),
  ]);
  assert.deepEqual(concurrent.map((item) => item.status).sort((a, b) => a - b), [200, 409]);
  const stale = await request('/performance/goals/steps', 'token-a', { method: 'PUT', body: JSON.stringify({ target: 13000, timezone: 'Europe/Lisbon', version: goal.body.data.version - 1 }) });
  assert.equal(stale.status, 409);
});

test('validates indexes and real persistence in the isolated database', async () => {
  const indexes = await Promise.all([models.Measurement.collection.indexes(), models.Steps.collection.indexes(), models.HeartRate.collection.indexes(), models.Goal.collection.indexes()]);
  assert.ok(indexes[0].some((item) => item.key.ownerId === 1 && item.key.kind === 1));
  assert.ok(indexes[1].some((item) => item.key.ownerId === 1 && item.key.localDate === 1));
  assert.ok(indexes[2].some((item) => item.key.ownerId === 1 && item.key.measuredAt === -1));
  assert.ok(indexes[3].some((item) => item.unique && item.key.ownerId === 1 && item.key.kind === 1));
  assert.ok(await models.Steps.countDocuments({ ownerId: ownerA }) > 0);
});
