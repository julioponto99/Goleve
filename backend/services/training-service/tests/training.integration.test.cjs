const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const test = require('node:test');

const mongoUri = process.env.TEST_MONGO_URI;
if (!mongoUri) throw new Error('TEST_MONGO_URI is required for the isolated integration suite');

const ownerA = '507f1f77bcf86cd799439011';
const ownerB = '507f1f77bcf86cd799439012';
const tokens = new Map([['token-a', ownerA], ['token-b', ownerB]]);
let authServer;
let appServer;
let connection;
let models;
let baseUrl;

function request(path, token, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(options.headers || {}) },
  }).then(async (response) => ({ status: response.status, body: await response.json() }));
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
  const { createTrainingModels, initializeModels } = require('../dist/models');
  const { createApp } = require('../dist/server');
  connection = await openDatabase(mongoUri);
  models = createTrainingModels(connection);
  await initializeModels(models);
  const app = await createApp(`http://127.0.0.1:${authServer.address().port}`, connection, models);
  appServer = app.listen(0);
  baseUrl = `http://127.0.0.1:${appServer.address().port}`;
});

test.after(async () => {
  await connection?.close();
  await new Promise((resolve) => authServer?.close(resolve));
  await new Promise((resolve) => appServer?.close(resolve));
});

test('persists catalog, private ownership, filters and pagination', async () => {
  const global = await models.Exercise.create({ name: 'Synthetic squat', muscleGroup: 'legs', equipment: [], environments: ['home'], difficulty: 'beginner', type: 'strength', instructions: 'Synthetic instructions' });
  const privateExercise = await request('/training/exercises', 'token-a', { method: 'POST', body: JSON.stringify({ name: 'Private press', muscleGroup: 'chest', equipment: ['band'], environments: ['home'], difficulty: 'intermediate', type: 'strength', instructions: 'Synthetic instructions' }) });
  assert.equal(privateExercise.status, 201);
  const hidden = await request(`/training/exercises/${privateExercise.body.data.id}`, 'token-b');
  assert.equal(hidden.status, 404);
  const listed = await request('/training/exercises?environment=home&page=1&pageSize=1', 'token-a');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.pageSize, 1);
  assert.ok(listed.body.data.total >= 2);
  assert.ok(global._id);
});

test('persists plan changes, snapshots, duplication and archive', async () => {
  const exercise = await models.Exercise.create({ name: 'Synthetic lunge', muscleGroup: 'legs', equipment: [], environments: ['outdoor'], difficulty: 'beginner', type: 'strength', instructions: 'Synthetic instructions' });
  const created = await request('/training/plans', 'token-a', { method: 'POST', body: JSON.stringify({ title: 'Synthetic plan', goals: ['strength'], days: ['monday'], exercises: [{ exerciseId: exercise._id.toString(), sets: 3, repetitions: 8 }] }) });
  assert.equal(created.status, 201);
  const planId = created.body.data.id;
  const updated = await request(`/training/plans/${planId}`, 'token-a', { method: 'PATCH', body: JSON.stringify({ title: 'Synthetic plan v2' }) });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.version, 2);
  assert.equal(updated.body.data.history.length, 1);
  const duplicate = await request(`/training/plans/${planId}/duplicate`, 'token-a', { method: 'POST', body: '{}' });
  assert.equal(duplicate.status, 201);
  const archived = await request(`/training/plans/${planId}/archive`, 'token-a', { method: 'POST', body: '{}' });
  assert.equal(archived.status, 200);
  const forbidden = await request(`/training/plans/${planId}`, 'token-b');
  assert.equal(forbidden.status, 404);
});

test('persists session lifecycle, exercise records and history', async () => {
  const exercise = await models.Exercise.create({ name: 'Synthetic row', muscleGroup: 'back', equipment: [], environments: ['gym'], difficulty: 'beginner', type: 'strength', instructions: 'Synthetic instructions' });
  const created = await request('/training/sessions', 'token-a', { method: 'POST', body: '{}' });
  const sessionId = created.body.data.id;
  assert.equal(created.status, 201);
  assert.equal((await request(`/training/sessions/${sessionId}/start`, 'token-a', { method: 'POST', body: '{}' })).status, 200);
  assert.equal((await request(`/training/sessions/${sessionId}/exercises`, 'token-a', { method: 'POST', body: JSON.stringify({ exerciseId: exercise._id.toString(), sets: [{ repetitions: 10, load: 20 }] }) })).status, 201);
  assert.equal((await request(`/training/sessions/${sessionId}/pause`, 'token-a', { method: 'POST', body: '{}' })).status, 200);
  assert.equal((await request(`/training/sessions/${sessionId}/resume`, 'token-a', { method: 'POST', body: '{}' })).status, 200);
  const completions = await Promise.all([1, 2].map(() => request(`/training/sessions/${sessionId}/complete`, 'token-a', { method: 'POST', body: '{}' })));
  assert.ok(completions.every((item) => item.status === 200));
  const history = await request('/training/sessions?status=completed', 'token-a');
  assert.equal(history.status, 200);
  assert.ok(history.body.data.items.some((item) => item.id === sessionId));
});

test('rejects missing and invalid JWT and invalid payloads', async () => {
  const missing = await fetch(`${baseUrl}/training/plans`);
  assert.equal(missing.status, 401);
  const invalid = await request('/training/plans', 'not-a-token');
  assert.equal(invalid.status, 401);
  const badPayload = await request('/training/plans', 'token-a', { method: 'POST', body: JSON.stringify({ title: '' }) });
  assert.equal(badPayload.status, 400);
});

test('validates indexes and atomic optimistic concurrency in MongoDB', async () => {
  const indexes = await models.Plan.collection.indexes();
  assert.ok(indexes.some((index) => index.key.ownerId === 1 && index.key.status === 1));
  const { TrainingService } = require('../dist/services/training.service');
  const service = new TrainingService(models);
  const created = await service.createPlan({ identity: { id: ownerA, userType: 'utilizador' } }, { title: 'Concurrent plan', goals: [], days: [], exercises: [] });
  const planId = created.id;
  const plan = await models.Plan.findById(planId);
  const result = await Promise.allSettled([
    models.Plan.findOneAndUpdate({ _id: planId, ownerId: ownerA, version: plan.version }, { $set: { title: 'winner-a' }, $inc: { version: 1 } }, { returnDocument: 'after' }),
    models.Plan.findOneAndUpdate({ _id: planId, ownerId: ownerA, version: plan.version }, { $set: { title: 'winner-b' }, $inc: { version: 1 } }, { returnDocument: 'after' }),
  ]);
  assert.equal(result.filter((item) => item.status === 'fulfilled' && item.value).length, 1);
  const stored = await models.Plan.findById(planId);
  assert.equal(stored.version, 2);
  assert.ok(['winner-a', 'winner-b'].includes(stored.title));
});

test('forwards training requests through a real Gateway app instance', async () => {
  const previousTarget = process.env.TRAINING_SERVICE_URL;
  process.env.TRAINING_SERVICE_URL = baseUrl;
  const { createApp: createGatewayApp } = require('../../../api-gateway/dist/app');
  const gateway = createGatewayApp();
  const gatewayServer = gateway.listen(0);
  const gatewayPort = gatewayServer.address().port;
  try {
    const response = await fetch(`http://127.0.0.1:${gatewayPort}/training/exercises?page=1`, { headers: { authorization: 'Bearer token-a' } });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.page, 1);
  } finally {
    if (previousTarget === undefined) delete process.env.TRAINING_SERVICE_URL;
    else process.env.TRAINING_SERVICE_URL = previousTarget;
    await new Promise((resolve) => gatewayServer.close(resolve));
  }
});
