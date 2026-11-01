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
let service;
let baseUrl;
function request(path, token, options = {}) {
  return fetch(`${baseUrl}${path}`, { ...options, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(options.headers || {}) } }).then(async (response) => ({ status: response.status, body: await response.json() }));
}
function event(id, recipientUserId = ownerA) {
  return { eventId: id, contractVersion: 1, type: 'hydration.reminder.requested.v1', source: 'hydration-service', recipientUserId, occurredAt: '2026-11-01T15:00:00.000Z', payload: { title: 'Hydration', body: 'Drink water' } };
}
test.before(async () => {
  authServer = http.createServer((req, res) => {
    const userId = tokens.get(req.headers.authorization?.replace('Bearer ', ''));
    if (req.url !== '/auth/me' || !userId) { res.writeHead(401); res.end(); return; }
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ user: { id: userId, userType: 'utilizador' } }));
  });
  await new Promise((resolve) => authServer.listen(0, '127.0.0.1', resolve));
  const { openDatabase } = require('../dist/config/database');
  const { createNotificationModels, initializeModels } = require('../dist/models');
  const { NotificationService } = require('../dist/services/notification.service');
  const { createApp } = require('../dist/server');
  connection = await openDatabase(mongoUri);
  models = createNotificationModels(connection); await initializeModels(models);
  service = new NotificationService(models);
  const app = await createApp(`http://127.0.0.1:${authServer.address().port}`, connection, service);
  serviceServer = app.listen(0); baseUrl = `http://127.0.0.1:${serviceServer.address().port}`;
});
test.after(async () => { await connection?.close(); await new Promise((resolve) => authServer?.close(resolve)); await new Promise((resolve) => serviceServer?.close(resolve)); });

test('persists events idempotently, applies preferences and isolates users', async () => {
  const first = await service.processEvent(event(`notification-${Date.now()}-1`));
  assert.equal(first.created, true);
  const duplicate = await service.processEvent(event(first.notification.eventId));
  assert.equal(duplicate.created, false);
  assert.equal((await request('/notifications/unread-count', 'token-a')).body.data.count, 1);
  const other = await request('/notifications', 'token-b');
  assert.equal(other.body.data.total, 0);
  const list = await request('/notifications?unread=true', 'token-a');
  assert.equal(list.body.data.total, 1);
  const read = await request(`/notifications/${list.body.data.items[0].id}/read`, 'token-a', { method: 'POST' });
  assert.ok(read.body.data.readAt);
  assert.equal((await request('/notifications/unread-count', 'token-a')).body.data.count, 0);
});

test('persists preferences and marks all notifications as read', async () => {
  const saved = await request('/notifications/preferences', 'token-a', { method: 'PUT', body: JSON.stringify({ enabled: false, hydrationReminders: false }) });
  assert.equal(saved.body.data.enabled, false);
  const suppressed = await service.processEvent(event(`notification-${Date.now()}-2`));
  assert.equal(suppressed.suppressed, true);
  const enabled = await request('/notifications/preferences', 'token-a', { method: 'PUT', body: JSON.stringify({ enabled: true, hydrationReminders: true, version: saved.body.data.version }) });
  assert.equal(enabled.body.data.version, saved.body.data.version + 1);
  await service.processEvent(event(`notification-${Date.now()}-3`));
  assert.equal((await request('/notifications/read-all', 'token-a', { method: 'POST' })).body.data.updated, 1);
});

test('rejects missing JWT, invalid event and stale preferences', async () => {
  assert.equal((await fetch(`${baseUrl}/notifications`)).status, 401);
  assert.throws(() => require('../dist/contracts/events').validateEvent({ eventId: 'bad' }));
  const preference = await request('/notifications/preferences', 'token-a');
  const stale = await request('/notifications/preferences', 'token-a', { method: 'PUT', body: JSON.stringify({ enabled: true, version: preference.body.data.version - 1 }) });
  assert.equal(stale.status, 409);
});

test('validates notification, preference and processed-event indexes', async () => {
  const [notifications, preferences, processed] = await Promise.all([models.Notification.collection.indexes(), models.Preference.collection.indexes(), models.ProcessedEvent.collection.indexes()]);
  assert.ok(notifications.some((item) => item.unique && item.key.eventId === 1));
  assert.ok(preferences.some((item) => item.unique && item.key.ownerId === 1));
  assert.ok(processed.some((item) => item.unique && item.key.eventId === 1));
  assert.ok(await models.Notification.countDocuments({ ownerId: ownerA }) > 0);
});
