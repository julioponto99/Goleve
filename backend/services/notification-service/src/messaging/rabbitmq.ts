import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { validateEvent } from '../contracts/events';
import { NotificationService } from '../services/notification.service';

export const notificationExchange = 'goleve.notifications';
export const notificationQueue = 'goleve.notification-service.events';
export const retryQueue = 'goleve.notification-service.events.retry';
export const failedQueue = 'goleve.notification-service.events.failed';

export class NotificationConsumer {
  private connection?: ChannelModel;
  private channel?: Channel;
  private healthy = false;
  constructor(private readonly url: string, private readonly service: NotificationService, private readonly retryDelayMs = 1000) {}
  isHealthy() { return this.healthy; }
  async start() {
    this.connection = await amqp.connect(this.url);
    const channel = await this.connection.createChannel();
    this.channel = channel;
    await channel.assertExchange(notificationExchange, 'topic', { durable: true });
    await channel.assertExchange(`${notificationExchange}.retry`, 'direct', { durable: true });
    await channel.assertExchange(`${notificationExchange}.failed`, 'direct', { durable: true });
    await channel.assertQueue(notificationQueue, { durable: true, deadLetterExchange: `${notificationExchange}.retry`, deadLetterRoutingKey: 'retry' });
    await channel.assertQueue(retryQueue, { durable: true, arguments: { 'x-message-ttl': this.retryDelayMs, 'x-dead-letter-exchange': notificationExchange, 'x-dead-letter-routing-key': 'event' } });
    await channel.assertQueue(failedQueue, { durable: true });
    await channel.bindQueue(notificationQueue, notificationExchange, 'event');
    await channel.bindQueue(retryQueue, `${notificationExchange}.retry`, 'retry');
    await channel.bindQueue(failedQueue, `${notificationExchange}.failed`, 'failed');
    await channel.prefetch(10);
    await channel.consume(notificationQueue, (message) => { if (message) void this.handle(message); });
    this.healthy = true;
  }
  private retryCount(message: ConsumeMessage) {
    const deaths = message.properties.headers?.['x-death'];
    if (!Array.isArray(deaths)) return 0;
    return deaths.reduce((total, item) => total + (item?.queue === notificationQueue ? Number(item.count ?? 0) : 0), 0);
  }
  private async handle(message: ConsumeMessage) {
    if (!this.channel) return;
    try {
      const event = validateEvent(JSON.parse(message.content.toString('utf8')));
      await this.service.processEvent(event);
      this.channel.ack(message);
    } catch (error) {
      const retries = this.retryCount(message);
      if (retries < 3) this.channel.nack(message, false, false);
      else {
        this.channel.publish(`${notificationExchange}.failed`, 'failed', message.content, { persistent: true, contentType: 'application/json' });
        this.channel.ack(message);
      }
      console.error('notification event processing failed', { code: error instanceof Error ? error.name : 'unknown', retries });
    }
  }
  async close() {
    this.healthy = false;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
