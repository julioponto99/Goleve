import { Types } from 'mongoose';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { NotificationEvent } from '../contracts/events';
import { NotificationModels } from '../models';

const dto = (doc: { _id: Types.ObjectId; toObject(): Record<string, unknown> }) => ({ id: doc._id.toHexString(), ...doc.toObject(), _id: undefined });
export interface ListOptions { page: number; pageSize: number; unread?: boolean }

export class NotificationService {
  constructor(private readonly models: NotificationModels, private readonly now = () => new Date()) {}
  async processEvent(event: NotificationEvent) {
    const preference = await this.models.Preference.findOne({ ownerId: event.recipientUserId });
    if (preference && (!preference.enabled || (event.type.startsWith('hydration.') && !preference.hydrationReminders) || (event.type.startsWith('training.') && !preference.trainingEvents) || (event.type.startsWith('agenda.') && !preference.agendaReminders))) {
      await this.models.ProcessedEvent.updateOne({ eventId: event.eventId }, { $setOnInsert: { eventId: event.eventId, eventType: event.type, processedAt: this.now() } }, { upsert: true });
      return { created: false, suppressed: true };
    }
    const existing = await this.models.Notification.findOne({ eventId: event.eventId });
    if (existing) return { created: false, suppressed: false, notification: dto(existing) };
    try {
      const notification = await this.models.Notification.create({ ownerId: event.recipientUserId, eventId: event.eventId, eventType: event.type, source: event.source, title: event.payload.title, body: event.payload.body, occurredAt: new Date(event.occurredAt) });
      await this.models.ProcessedEvent.updateOne({ eventId: event.eventId }, { $setOnInsert: { eventId: event.eventId, eventType: event.type, processedAt: this.now() } }, { upsert: true });
      return { created: true, suppressed: false, notification: dto(notification) };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return { created: false, suppressed: false };
      throw error;
    }
  }
  async list(ctx: RequestContext, options: ListOptions) {
    const filter: Record<string, unknown> = { ownerId: ctx.identity.id };
    if (options.unread) filter.readAt = null;
    const [items, total] = await Promise.all([this.models.Notification.find(filter).sort({ createdAt: -1, _id: 1 }).skip((options.page - 1) * options.pageSize).limit(options.pageSize), this.models.Notification.countDocuments(filter)]);
    return { items: items.map(dto), page: options.page, pageSize: options.pageSize, total, totalPages: Math.ceil(total / options.pageSize) };
  }
  async unreadCount(ctx: RequestContext) { return { count: await this.models.Notification.countDocuments({ ownerId: ctx.identity.id, readAt: null }) }; }
  async markRead(ctx: RequestContext, notificationId: string) {
    if (!/^[a-f0-9]{24}$/.test(notificationId)) throw new ApiError(400, 'INVALID_ID', 'Invalid notification identifier');
    const notification = await this.models.Notification.findOneAndUpdate({ _id: notificationId, ownerId: ctx.identity.id, readAt: null }, { $set: { readAt: this.now() } }, { returnDocument: 'after' });
    if (!notification) {
      const existing = await this.models.Notification.findOne({ _id: notificationId, ownerId: ctx.identity.id });
      if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
      return dto(existing);
    }
    return dto(notification);
  }
  async markAllRead(ctx: RequestContext) {
    const result = await this.models.Notification.updateMany({ ownerId: ctx.identity.id, readAt: null }, { $set: { readAt: this.now() } });
    return { updated: result.modifiedCount };
  }
  async getPreferences(ctx: RequestContext) {
    const preference = await this.models.Preference.findOne({ ownerId: ctx.identity.id });
    return dto(preference ?? await this.models.Preference.create({ ownerId: ctx.identity.id }));
  }
  async setPreferences(ctx: RequestContext, body: Record<string, unknown>) {
    const current = await this.models.Preference.findOne({ ownerId: ctx.identity.id });
    const version = body.version === undefined ? current?.version ?? 1 : Number(body.version);
    if (!Number.isInteger(version) || version < 1 || (current && version !== current.version)) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Preferences changed concurrently; read them again');
    const values = ['enabled', 'hydrationReminders', 'trainingEvents', 'agendaReminders'];
    const update: Record<string, boolean> = {};
    for (const key of values) if (body[key] !== undefined) { if (typeof body[key] !== 'boolean') throw new ApiError(400, 'INVALID_PREFERENCE', `${key} must be boolean`); update[key] = body[key] as boolean; }
    if (!current) return dto(await this.models.Preference.create({ ownerId: ctx.identity.id, ...update }));
    const result = await this.models.Preference.findOneAndUpdate({ ownerId: ctx.identity.id, version }, { $set: update, $inc: { version: 1 } }, { returnDocument: 'after', runValidators: true });
    if (!result) throw new ApiError(409, 'CONCURRENT_UPDATE', 'Preferences changed concurrently; read them again');
    return dto(result);
  }
}
