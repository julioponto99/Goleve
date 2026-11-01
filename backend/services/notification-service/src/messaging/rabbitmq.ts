import amqp, { Channel, ConfirmChannel, ChannelModel, ConsumeMessage } from 'amqplib';
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
  private failureChannel?: ConfirmChannel;
  constructor(private readonly url: string, private readonly service: NotificationService, private readonly retryDelayMs = 1000) {}
  isHealthy() { return this.healthy; }
  async start() {
    this.healthy = false;
    let unavailable = false;
    const markUnavailable = () => { unavailable = true; this.healthy = false; };
    this.connection = await amqp.connect(this.url);
    this.connection.on('error', markUnavailable);
    this.connection.on('close', markUnavailable);
    const channel = await this.connection.createChannel();
    this.channel = channel;
    channel.on('error', markUnavailable);
    channel.on('close', markUnavailable);
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
    await channel.consume(notificationQueue, (message) => { if (message) void this.handle(message).catch(markUnavailable); else markUnavailable(); });
    this.healthy = !unavailable;
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
        if(!this.failureChannel){this.failureChannel=await this.connection!.createConfirmChannel();this.failureChannel.on('error',()=>{this.healthy=false;});this.failureChannel.on('close',()=>{this.healthy=false;this.failureChannel=undefined;});}
        const channel=this.failureChannel;
        let returned=false;const onReturn=()=>{returned=true;};channel.on('return',onReturn);
        try{
          await new Promise<void>((resolve,reject)=>channel.publish(`${notificationExchange}.failed`,'failed',message.content,{persistent:true,mandatory:true,contentType:'application/json',messageId:message.properties.messageId},error=>error?reject(error):resolve()));
          if(returned)throw new Error('DLQ publication unroutable');
          this.channel.ack(message);
        }finally{channel.removeListener('return',onReturn);}
      }
      console.error('notification event processing failed', { code: error instanceof Error ? error.name : 'unknown', retries });
    }
  }
  async close() {
    this.healthy = false;
    await this.failureChannel?.close().catch(()=>undefined);this.failureChannel=undefined;
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
