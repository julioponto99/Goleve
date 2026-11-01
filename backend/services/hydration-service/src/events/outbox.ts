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
  const connection: ChannelModel = await amqp.connect(rabbitUrl); const channel: ConfirmChannel = await connection.createConfirmChannel();
  await channel.assertExchange('goleve.notifications', 'topic', { durable: true });
  for (let i = 0; i < limit; i += 1) {
    const now = new Date();
    const event = await models.Outbox.findOneAndUpdate({ status: { $in: ['pending', 'failed', 'publishing'] }, nextAttemptAt: { $lte: now }, $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] }, { $set: { status: 'publishing', lockedUntil: new Date(now.getTime() + 30000) }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, returnDocument: 'after' });
    if (!event) break;
    try {
      await new Promise<void>((resolve, reject) => channel.publish('goleve.notifications', 'event', Buffer.from(JSON.stringify({ eventId: event.eventId, contractVersion: event.eventVersion, type: event.eventType, source: event.sourceService, recipientUserId: event.recipientUserId, occurredAt: event.occurredAt.toISOString(), payload: event.payload })), { persistent: true, contentType: 'application/json' }, (error) => error ? reject(error) : resolve()));
      await models.Outbox.updateOne({ _id: event._id, status: 'publishing' }, { $set: { status: 'published', publishedAt: new Date(), lockedUntil: undefined } });
    } catch (error) {
      await models.Outbox.updateOne({ _id: event._id, status: 'publishing' }, { $set: { status: 'failed', lastError: error instanceof Error ? error.message.slice(0, 500) : 'publish failed', nextAttemptAt: new Date(Date.now() + Math.min(300000, 1000 * 2 ** Math.min(event.attempts, 8))), lockedUntil: undefined } });
    }
  }
  await channel.close(); await connection.close();
}
export async function withOutboxTransaction<T>(connection: Connection, operation: (session: ClientSession) => Promise<T>) {
  if (!outboxEnabled()) throw new Error('Transactional outbox is disabled; MongoDB replica set is required');
  const session = await connection.startSession();
  try { let result!: T; await session.withTransaction(async () => { result = await operation(session); }); return result; } finally { await session.endSession(); }
}
