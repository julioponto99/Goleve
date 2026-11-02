const { test } = require('node:test'), assert = require('node:assert/strict'), { EventEmitter } = require('node:events');
const { createRequire } = require('node:module'), path = require('node:path');
for (const name of ['training', 'hydration']) {
  const local = createRequire(path.resolve(__dirname, '../../' + name + '-service/package.json'));
  const amqp = local('amqplib'), { publishPending } = local('./dist/events/outbox');
  async function run(outcome) {
    const saved = amqp.connect, updates = [], declarations = [], emitted = [];
    let claimed = false, closed = false, channelClosed = false;
    const connection = new EventEmitter(), channel = new EventEmitter();
    Object.assign(channel, { assertExchange: async () => {}, assertQueue: async (...args) => declarations.push(args), bindQueue: async () => {}, close: async () => { channelClosed = true; }, publish(_exchange, _key, _body, options, callback) { emitted.push(options); if (outcome === 'unroutable') channel.emit('return', { properties: { messageId: options.messageId } }); callback(outcome === 'failure' ? new Error('DO_NOT_PERSIST_SECRET') : null); } });
    Object.assign(connection, { createConfirmChannel: async () => { if (outcome === 'setup') throw Error('setup'); return channel; }, close: async () => { closed = true; } });
    amqp.connect = async () => connection;
    const models = { Outbox: { async findOneAndUpdate(filter, update) { if (claimed) return null; claimed = true; assert(filter.$or.some(x => x.lockedUntil?.$lte instanceof Date)); return { _id: 'event-doc', eventId: 'event-integration-1', eventType: 'training.session.completed.v1', eventVersion: 1, sourceService: name + '-service', recipientUserId: '507f1f77bcf86cd799439011', occurredAt: new Date(), payload: { title: 'Fictional', body: 'Fictional' }, attempts: 1, ...update.$set }; }, async updateOne(filter, update) { updates.push({ filter, update }); } } };
    try { if (outcome === 'setup') await assert.rejects(publishPending(models, 'amqp://not-used.invalid')); else await publishPending(models, 'amqp://not-used.invalid'); } finally { amqp.connect = saved; }
    return { updates, declarations, emitted, closed, channelClosed };
  }
  test(name + ' publishes persistent mandatory events to a durable bound route with a claim identity', async () => { const r = await run('success'); assert(r.closed && r.channelClosed); assert.equal(r.emitted[0].mandatory, true); assert.equal(r.emitted[0].persistent, true); assert.equal(r.emitted[0].messageId, 'event-integration-1'); assert.equal(r.declarations[0][1].deadLetterExchange, 'goleve.notifications.retry'); assert.match(r.updates[0].filter.leaseId, /^[a-f0-9-]{36}$/); assert.equal(r.updates[0].update.$set.status, 'published'); assert.equal(r.updates[0].update.$unset.lockedUntil, 1); });
  test(name + ' retains unroutable events instead of acknowledging them as published', async () => { const r = await run('unroutable'); assert.equal(r.updates[0].update.$set.status, 'failed'); assert(r.updates[0].update.$set.nextAttemptAt > new Date()); });
  test(name + ' publication failures preserve retry state without raw error contents', async () => { const r = await run('failure'); assert.equal(r.updates[0].update.$set.lastError, 'PUBLISH_UNCONFIRMED'); assert(!JSON.stringify(r.updates).includes('DO_NOT_PERSIST_SECRET')); assert(r.closed); });
  test(name + ' closes the connection even when confirm channel setup fails', async () => { assert((await run('setup')).closed); });
}
