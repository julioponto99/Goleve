const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter, once } = require('node:events');
const amqp = require('amqplib');
const { createApp } = require('../dist/server');
const { NotificationConsumer } = require('../dist/messaging/rabbitmq');

async function withHttp(connection, consumer, work) {
  const app = await createApp('http://auth.example.invalid', connection, {}, consumer);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await work('http://127.0.0.1:' + server.address().port); }
  finally { const closed = new Promise(resolve => server.close(resolve)); server.closeAllConnections(); await closed; }
}
const database = () => ({ readyState: 1, db: { admin: () => ({ ping: async () => ({ ok: 1 }) }) } });
function broker() {
  const connection = new EventEmitter(), channel = new EventEmitter();
  for (const name of ['assertExchange', 'assertQueue', 'bindQueue', 'prefetch', 'close']) channel[name] = async () => {};
  channel.consume = async (_queue, callback) => { channel.deliver = callback; return { consumerTag: 'synthetic-consumer' }; };
  connection.createChannel = async () => channel; connection.close = async () => {};
  return { connection, channel };
}
async function withBroker(work, service = {}) {
  const original = amqp.connect, mock = broker(); amqp.connect = async () => mock.connection;
  const consumer = new NotificationConsumer('amqp://synthetic.invalid', service);
  try { await work(consumer, mock); } finally { await consumer.close(); amqp.connect = original; }
}

test('liveness is 200 without probing unavailable MongoDB or RabbitMQ', async () => {
  let probes = 0;
  const connection = { readyState: 0, get db() { probes++; throw Error('Liveness must not probe dependencies'); } };
  await withHttp(connection, { isHealthy() { probes++; throw Error('Liveness must not probe RabbitMQ'); } }, async base => {
    const r = await fetch(base + '/health'); assert.equal(r.status, 200); assert.equal((await r.json()).status, 'ok'); assert.equal(r.headers.get('cache-control'), 'no-store');
  });
  assert.equal(probes, 0);
});
test('readiness requires MongoDB and a consumer; the same HTTP process stays live', async () => {
  let healthy = false; const connection = database();
  await withHttp(connection, { isHealthy: () => healthy }, async base => {
    let r = await fetch(base + '/ready'); assert.equal(r.status, 503); assert.equal((await r.json()).rabbitmq, 'unavailable');
    healthy = true; r = await fetch(base + '/ready'); assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
    connection.readyState = 0; r = await fetch(base + '/ready'); assert.equal(r.status, 503); assert.equal((await r.json()).database, 'unavailable');
    assert.equal((await fetch(base + '/health')).status, 200);
  });
  await withHttp(database(), undefined, async base => assert.equal((await fetch(base + '/ready')).status, 503));
});
test('MongoDB ping failure makes readiness 503 without breaking liveness', async () => {
  const connection = database(); connection.db.admin = () => ({ ping: async () => { throw Error('Synthetic database failure'); } });
  await withHttp(connection, { isHealthy: () => true }, async base => {
    assert.equal((await fetch(base + '/ready')).status, 503); assert.equal((await fetch(base + '/health')).status, 200);
  });
});
for (const endpoint of ['connection', 'channel']) for (const event of ['error', 'close']) {
  test('RabbitMQ ' + endpoint + ' ' + event + ' clears readiness without stopping HTTP', async () => withBroker(async (consumer, mock) => {
    assert.equal(consumer.isHealthy(), false); await consumer.start(); assert.equal(consumer.isHealthy(), true);
    await withHttp(database(), consumer, async base => {
      assert.equal((await fetch(base + '/ready')).status, 200);
      mock[endpoint].emit(event, ...(event === 'error' ? [Error('Synthetic transport failure')] : []));
      assert.equal(consumer.isHealthy(), false); assert.equal((await fetch(base + '/ready')).status, 503); assert.equal((await fetch(base + '/health')).status, 200);
    });
  }));
}
test('broker cancellation and explicit close clear consumer readiness', async () => withBroker(async (consumer, mock) => {
  await consumer.start(); mock.channel.deliver(null); assert.equal(consumer.isHealthy(), false);
  await consumer.start(); assert.equal(consumer.isHealthy(), true); await consumer.close(); assert.equal(consumer.isHealthy(), false);
}));
test('failure during consumer registration cannot finish startup as healthy', async () => withBroker(async (consumer, mock) => {
  mock.channel.consume = async () => { mock.channel.emit('close'); return { consumerTag: 'synthetic' }; };
  await consumer.start(); assert.equal(consumer.isHealthy(), false);
}));
test('initial RabbitMQ connection failure leaves readiness unavailable', async () => {
  const original = amqp.connect; amqp.connect = async () => { throw Error('Synthetic RabbitMQ unavailable'); };
  const consumer = new NotificationConsumer('amqp://synthetic.invalid', {});
  try { await assert.rejects(consumer.start()); assert.equal(consumer.isHealthy(), false); }
  finally { amqp.connect = original; }
});
test('channel failure during ACK/NACK is contained and leaves HTTP alive', async () => {
  let processed = 0;
  await withBroker(async (consumer, mock) => {
    mock.channel.ack = () => { throw Error('Synthetic closed channel'); };
    mock.channel.nack = () => { throw Error('Synthetic closed channel'); };
    await consumer.start();
    mock.channel.deliver({ content: Buffer.from(JSON.stringify({ eventId: 'synthetic-event-123', contractVersion: 1, type: 'training.session.completed.v1', source: 'training-service', recipientUserId: '507f1f77bcf86cd799439011', occurredAt: '2026-11-01T15:00:00Z', payload: { title: 'Synthetic', body: 'Synthetic notification' } })), properties: { headers: {} } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(processed, 1); assert.equal(consumer.isHealthy(), false);
    await withHttp(database(), consumer, async base => {
      assert.equal((await fetch(base + '/ready')).status, 503); assert.equal((await fetch(base + '/health')).status, 200);
    });
  }, { processEvent: async () => { processed++; } });
});
