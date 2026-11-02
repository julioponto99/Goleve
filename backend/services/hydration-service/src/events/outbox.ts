import { randomUUID } from 'node:crypto';
import { ClientSession, Connection } from 'mongoose';
import amqp, { ChannelModel, ConfirmChannel } from 'amqplib';
import { HydrationModels } from '../models';
import { OutboxEventData } from '../models/outbox.model';

export const outboxEnabled = () => process.env.OUTBOX_ENABLED === 'true';
export async function assertTransactionsAvailable(connection: Connection) {
  if (!outboxEnabled()) return false;
  const hello = await connection.db?.admin().command({ hello: 1 });
  if (!hello?.setName) throw new Error('OUTBOX_ENABLED requires a MongoDB replica set');
  return true;
}
export function newOutboxEvent(eventType: string, aggregateId: string, recipientUserId: string, payload: Record<string, unknown>): OutboxEventData {
  return { eventId: randomUUID(), eventType, eventVersion: 1, sourceService: 'hydration-service', aggregateId, recipientUserId, occurredAt: new Date(), payload, status: 'pending', attempts: 0, nextAttemptAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
}
export async function publishPending(models: HydrationModels, rabbitUrl: string, limit = 10) {
  const connection = await amqp.connect(rabbitUrl, { timeout: 3000 });
  connection.on('error', () => undefined);
  try {
    const channel = await connection.createConfirmChannel(); channel.on('error', () => undefined);
    try {
      await channel.assertExchange('goleve.notifications', 'topic', { durable: true });
      // Keep a durable route even while the notification consumer is down.
      await channel.assertQueue('goleve.notification-service.events', { durable: true, deadLetterExchange: 'goleve.notifications.retry', deadLetterRoutingKey: 'retry' });
      await channel.bindQueue('goleve.notification-service.events', 'goleve.notifications', 'event');
      for (let i = 0; i < limit; i++) {
        const now = new Date(), leaseId = randomUUID();
        const event = await models.Outbox.findOneAndUpdate({ status: { $in: ['pending', 'failed', 'publishing'] }, nextAttemptAt: { $lte: now }, $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] }, { $set: { status: 'publishing', leaseId, lockedUntil: new Date(now.getTime() + 30000) }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: 'after' });
        if (!event) break;
        const claimed = { _id: event._id, status: 'publishing', leaseId };
        let returned = false;
        const onReturn = (message: { properties: { messageId?: string } }) => { if (message.properties.messageId === event.eventId) returned = true; };
        channel.on('return', onReturn);
        try {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Publication confirmation unavailable')), 5000);
            channel.publish('goleve.notifications', 'event', Buffer.from(JSON.stringify({ eventId: event.eventId, contractVersion: event.eventVersion, type: event.eventType, source: event.sourceService, recipientUserId: event.recipientUserId, occurredAt: event.occurredAt.toISOString(), payload: event.payload })), { persistent: true, mandatory: true, contentType: 'application/json', messageId: event.eventId }, error => { clearTimeout(timer); error ? reject(error) : resolve(); });
          });
          if (returned) throw new Error('Unroutable publication');
          await models.Outbox.updateOne(claimed, { $set: { status: 'published', publishedAt: new Date() }, $unset: { leaseId: 1, lockedUntil: 1, lastError: 1 } });
        } catch {
          await models.Outbox.updateOne(claimed, { $set: { status: 'failed', lastError: 'PUBLISH_UNCONFIRMED', nextAttemptAt: new Date(Date.now() + Math.min(300000, 1000 * 2 ** Math.min(event.attempts, 8))) }, $unset: { leaseId: 1, lockedUntil: 1 } });
        } finally { channel.removeListener('return', onReturn); }
      }
    } finally { await channel.close().catch(() => undefined); }
  } finally { await connection.close().catch(() => undefined); }
}
export async function withOutboxTransaction<T>(connection: Connection, operation: (session: ClientSession) => Promise<T>) {
  if (!outboxEnabled()) throw new Error('Transactional outbox is disabled; MongoDB replica set is required');
  const session = await connection.startSession();
  try { let result!: T; await session.withTransaction(async () => { result = await operation(session); }); return result; } finally { await session.endSession(); }
}
