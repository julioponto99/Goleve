const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const test = require('node:test');

const ownerA = '507f1f77bcf86cd799439011';
const ownerB = '507f1f77bcf86cd799439012';
const { validateEvent } = require('../dist/contracts/events');
const { notificationSchema } = require('../dist/models/notification.model');
const { preferenceSchema } = require('../dist/models/preference.model');

test('validates versioned notification events and rejects unsafe payloads', () => {
  const event = validateEvent({ eventId: 'event-12345678', contractVersion: 1, type: 'hydration.reminder.requested.v1', source: 'hydration-service', recipientUserId: ownerA, occurredAt: '2026-11-01T15:00:00.000Z', payload: { title: 'Hydration', body: 'Drink water' } });
  assert.equal(event.recipientUserId, ownerA);
  assert.throws(() => validateEvent({ ...event, contractVersion: 2 }));
  assert.throws(() => validateEvent({ ...event, recipientUserId: ownerB, payload: { title: '', body: 'x' } }));
});

test('schemas validate notification ownership and preference defaults', async () => {
  const notification = new mongoose.Document({ ownerId: ownerA, eventId: 'event-12345678', eventType: 'training.session.completed.v1', source: 'training-service', title: 'Training', body: 'Completed', occurredAt: new Date() }, notificationSchema);
  const preference = new mongoose.Document({ ownerId: ownerA }, preferenceSchema);
  await Promise.all([notification.validate(), preference.validate()]);
  assert.equal(preference.enabled, true);
  await assert.rejects(() => new mongoose.Document({ ownerId: 'not-an-owner', eventId: 'event-12345679', eventType: 'bad', source: 'x', title: 'x', body: 'x', occurredAt: new Date() }, notificationSchema).validate());
});

test('gateway forwards notification requests and authorization', async () => {
  const received = await new Promise((resolve) => {
    const upstream = http.createServer((req, res) => {
      resolve({ url: req.url, authorization: req.headers.authorization });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: { items: [] } }));
    });
    upstream.listen(0, () => {
      process.env.NOTIFICATION_SERVICE_URL = `http://127.0.0.1:${upstream.address().port}`;
      const { createApp } = require('../../../api-gateway/dist/app');
      const gateway = http.createServer(createApp());
      gateway.listen(0, async () => {
        const response = await fetch(`http://127.0.0.1:${gateway.address().port}/notifications?page=1`, { headers: { authorization: 'Bearer synthetic-token' } });
        assert.equal(response.status, 200);
        gateway.close(() => upstream.close());
      });
    });
  });
  assert.deepEqual(received, { url: '/notifications?page=1', authorization: 'Bearer synthetic-token' });
});
