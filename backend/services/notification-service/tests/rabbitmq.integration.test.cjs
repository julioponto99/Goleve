const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const test = require('node:test');
const amqp = require('amqplib');

const mongoUri = process.env.TEST_MONGO_URI;
const rabbitUrl = process.env.TEST_RABBITMQ_URL;
if (!mongoUri || !rabbitUrl) throw new Error('TEST_MONGO_URI and TEST_RABBITMQ_URL are required');
const ownerId = new mongoose.Types.ObjectId().toHexString();
let connection;
let models;
let channel;
let publisher;
let consumer;

function event(eventId) {
  return { eventId, contractVersion: 1, type: 'hydration.reminder.requested.v1', source: 'hydration-service', recipientUserId: ownerId, occurredAt: '2026-11-01T15:00:00.000Z', payload: { title: 'Hydration', body: 'Drink water' } };
}
async function waitFor(check, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('Timed out waiting for RabbitMQ processing');
}

test.before(async () => {
  const { openDatabase } = require('../dist/config/database');
  const { createNotificationModels, initializeModels } = require('../dist/models');
  const { NotificationService } = require('../dist/services/notification.service');
  const { NotificationConsumer } = require('../dist/messaging/rabbitmq');
  connection = await openDatabase(mongoUri);
  models = createNotificationModels(connection);
  await initializeModels(models);
  consumer = new NotificationConsumer(rabbitUrl, new NotificationService(models), 50);
  await consumer.start();
  publisher = await amqp.connect(rabbitUrl);
  channel = await publisher.createChannel();
});
test.after(async () => {
  await consumer?.close();
  await channel?.close().catch(() => undefined);
  await publisher?.close().catch(() => undefined);
  await connection?.close();
});

test('consumes valid events idempotently and sends invalid messages to the failed queue', async () => {
  const { notificationExchange, failedQueue } = require('../dist/messaging/rabbitmq');
  const eventId = `rabbit-${Date.now()}-1`;
  channel.publish(notificationExchange, 'event', Buffer.from(JSON.stringify(event(eventId))), { persistent: true, contentType: 'application/json' });
  await waitFor(async () => (await models.Notification.countDocuments({ eventId })) === 1);
  channel.publish(notificationExchange, 'event', Buffer.from(JSON.stringify(event(eventId))), { persistent: true, contentType: 'application/json' });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(await models.Notification.countDocuments({ eventId }), 1);
  channel.publish(notificationExchange, 'event', Buffer.from('{invalid-json'), { persistent: true, contentType: 'application/json' });
  await waitFor(async () => (await channel.checkQueue(failedQueue)).messageCount >= 1, 5000);
  assert.equal(await models.Notification.countDocuments({ ownerId }), 1);
});
