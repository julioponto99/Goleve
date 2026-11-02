'use strict';
const fs = require('node:fs'), { createRequire } = require('node:module'), path = require('node:path');
const local = createRequire(path.join(process.cwd(), 'package.json'));
async function main() {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!/^[a-f0-9]{16}$/.test(input.instance || '')) throw Error('Instance required');
  if (input.action === 'database') {
    const uri = new URL(process.env.MONGO_URI);
    if (!uri.pathname.includes(input.instance) || uri.hostname !== 'mongodb') throw Error('Database is not isolated');
    const mongoose = local('mongoose'), c = await mongoose.createConnection(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
    try {
      const h = await c.db.admin().command({ hello: 1 });
      if (h.setName !== 'goleveIntegrationV1') throw Error('Unexpected topology');
      let denied = false;
      try { await c.getClient().db('goleve_integration_' + input.instance + '_forbidden').collection('probe').findOne({}); } catch (e) { denied = e.code === 13; }
      if (!denied) throw Error('Cross-database access was not denied');
      let admins;
      if (process.cwd().endsWith('/auth-service')) admins = await c.db.collection('auth_users').countDocuments({ userType: 'administrador' });
      return { isolatedDatabase: true, otherDatabaseDenied: true, replicaSet: true, ...(admins === undefined ? {} : { administrators: admins }) };
    } finally { await c.close(); }
  }
  if (input.action === 'events') {
    const amqp = local('amqplib'), c = await amqp.connect(process.env.RABBITMQ_URL, { timeout: 3000 });
    try {
      const channel = await c.createConfirmChannel();
      if (input.event) {
        if (!/^[a-f0-9]{24}$/.test(input.event.recipientUserId || '')) throw Error('Fictitious event owner required');
        for (let i = 0; i < (input.repeat || 1); i++) await new Promise((resolve, reject) => channel.publish('goleve.notifications', 'event', Buffer.from(JSON.stringify(input.event)), { persistent: true, mandatory: true, messageId: input.event.eventId, contentType: 'application/json' }, e => e ? reject(e) : resolve()));
      }
      const queues = {};
      for (const name of ['goleve.notification-service.events', 'goleve.notification-service.events.retry', 'goleve.notification-service.events.failed']) {
        const q = await channel.checkQueue(name); queues[name] = { messages: q.messageCount, consumers: q.consumerCount };
      }
      await channel.close(); return { queues };
    } finally { await c.close(); }
  }
  if (input.action === 'eligibility') {
    const { signServiceRequest, loadServiceKeys } = local('./dist/professional/service-auth');
    const body = { capabilityId: '507f1f77bcf86cd799439011' };
    const r = await fetch(process.env.PROFESSIONAL_SERVICE_URL + '/internal/v1/agenda/eligibility', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: signServiceRequest(body, loadServiceKeys()) }, body: JSON.stringify(body) });
    if (r.status !== 404) throw Error('Nonexistent professional unexpectedly authorized');
    return { dedicatedContractAuthenticated: true, unapprovedProfessionalDenied: true };
  }
  throw Error('Unknown integration probe');
}
void main().then(result => console.log(JSON.stringify(result))).catch(e => { console.error('Isolated probe failed: ' + (e.code || e.name)); process.exitCode = 1; });
