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

test.before(async () => {
  const { openDatabase } = require('../dist/config/database');
  const { createTrainingModels, initializeModels } = require('../dist/models');
  const { TrainingService } = require('../dist/services/training.service');
  connection = await openDatabase(uri);
  models = createTrainingModels(connection);
  await initializeModels(models);
  service = new TrainingService(models);
});
test.after(async () => { await connection?.close(); });

test('commits training completion and outbox atomically', async () => {
  const session = await models.Session.create({ ownerId, status: 'running', exercises: [], version: 1 });
  const result = await service.transitionSession({ identity: { id: ownerId, userType: 'utilizador' }, requestId: 'synthetic' }, session._id.toHexString(), 'complete');
  assert.equal(result.status, 'completed');
  assert.equal(await models.Outbox.countDocuments({ aggregateId: session._id.toHexString(), status: 'pending' }), 1);
});

test('rolls back domain and outbox together when transaction fails', async () => {
  const { withOutboxTransaction, newOutboxEvent } = require('../dist/events/outbox');
  const sessionId = new mongoose.Types.ObjectId();
  await assert.rejects(() => withOutboxTransaction(connection, async (transactionSession) => {
    await models.Session.create([{ _id: sessionId, ownerId, status: 'running', exercises: [], version: 1 }], { session: transactionSession });
    await models.Outbox.create([newOutboxEvent('training.session.completed.v1', sessionId.toHexString(), ownerId, { title: 'Synthetic', body: 'Synthetic' })], { session: transactionSession });
    throw new Error('synthetic rollback');
  }));
  assert.equal(await models.Session.countDocuments({ _id: sessionId }), 0);
  assert.equal(await models.Outbox.countDocuments({ aggregateId: sessionId.toHexString() }), 0);
});

test('rejects transactional outbox when capability check finds standalone MongoDB', async () => {
  const { assertTransactionsAvailable } = require('../dist/events/outbox');
  await assert.rejects(() => assertTransactionsAvailable({ db: { admin: () => ({ command: async () => ({}) }) } }), /replica set/);
});
