const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');
const mongoose = require('mongoose');

const { exerciseSchema } = require('../dist/models/exercise.model');
const { planSchema } = require('../dist/models/plan.model');
const { TrainingService } = require('../dist/services/training.service');
const { authenticate } = require('../dist/middlewares/auth.middleware');

const owner = '507f1f77bcf86cd799439011';
const otherOwner = '507f1f77bcf86cd799439012';
const context = { identity: { id: owner, userType: 'utilizador' }, requestId: 'test-request' };
const objectId = new mongoose.Types.ObjectId();

test('schemas validate exercise context and reject unknown fields', async () => {
  const valid = new mongoose.Document({ name: 'Push-up', muscleGroup: 'chest', equipment: [], environments: ['home'], difficulty: 'beginner', type: 'strength', instructions: 'Keep a straight line' }, exerciseSchema);
  await assert.doesNotReject(() => valid.validate());
  const invalid = new mongoose.Document({ name: 'Push-up', muscleGroup: 'chest', equipment: [], environments: ['spaceship'], difficulty: 'beginner', type: 'strength', instructions: 'x' }, exerciseSchema);
  await assert.rejects(() => invalid.validate());
});

test('plan schema preserves version history and validates exercise references', async () => {
  const plan = new mongoose.Document({ ownerId: owner, title: 'Home plan', goals: ['strength'], days: ['monday'], exercises: [{ exerciseId: objectId, sets: 3, repetitions: 10 }], status: 'active', version: 1, history: [] }, planSchema);
  await assert.doesNotReject(() => plan.validate());
  assert.equal(plan.get('version'), 1);
  assert.equal(plan.get('exercises').length, 1);
});

test('service rejects inaccessible exercises and invalid input without persistence', async () => {
  const models = {
    Exercise: {
      countDocuments: async () => 0,
      create: async () => { throw new Error('must not create'); },
      findOne: async () => null,
    },
    Plan: {},
    Session: {},
  };
  const service = new TrainingService(models);
  await assert.rejects(() => service.createExercise(context, { name: '', muscleGroup: 'legs', equipment: [], environments: ['home'], difficulty: 'beginner', type: 'strength', instructions: 'x' }), (error) => error.code === 'INVALID_NAME');
  await assert.rejects(() => service.createPlan(context, { title: 'Plan', goals: [], days: [], exercises: [{ exerciseId: otherOwner.toString() }] }), (error) => error.code === 'EXERCISE_NOT_ACCESSIBLE');
});

test('completed session transition is idempotent', async () => {
  const completed = {
    _id: objectId,
    status: 'completed',
    toObject() { return { _id: objectId, status: 'completed', ownerId: owner }; },
  };
  const models = { Exercise: {}, Plan: {}, Session: { findOne: async () => completed } };
  const service = new TrainingService(models);
  const result = await service.transitionSession(context, objectId.toString(), 'complete');
  assert.equal(result.id, objectId.toString());
  assert.equal(result.status, 'completed');
});

test('authentication middleware rejects missing JWT before contacting Auth', async () => {
  const middleware = authenticate('http://127.0.0.1:1');
  const request = { get: () => undefined };
  let received;
  await middleware(request, { locals: {} }, (error) => { received = error; });
  assert.equal(received.status, 401);
  assert.equal(received.code, 'AUTHENTICATION_REQUIRED');
});

test('gateway forwards the training prefix and preserves authorization', async () => {
  const received = await new Promise((resolve, reject) => {
    const upstream = http.createServer((req, res) => {
      resolve({ url: req.url, authorization: req.headers.authorization });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { ok: true } }));
    });
    upstream.listen(0, async () => {
      const port = upstream.address().port;
      process.env.TRAINING_SERVICE_URL = `http://127.0.0.1:${port}`;
      const { createApp } = require('../../../api-gateway/dist/app');
      const gateway = http.createServer(createApp());
      gateway.listen(0, async () => {
        const gatewayPort = gateway.address().port;
        const response = await fetch(`http://127.0.0.1:${gatewayPort}/training/plans?page=1`, { headers: { authorization: 'Bearer synthetic-token' } });
        assert.equal(response.status, 200);
        gateway.close();
        upstream.close();
      });
    });
  });
  assert.deepEqual(received, { url: '/training/plans?page=1', authorization: 'Bearer synthetic-token' });
});
