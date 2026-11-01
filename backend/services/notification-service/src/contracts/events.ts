import { randomUUID } from 'node:crypto';
import { ApiError } from '../config/errors';

export const supportedEventTypes = ['hydration.reminder.requested.v1', 'hydration.daily_goal.reached.v1', 'training.session.completed.v1', 'agenda.activity.reminder.requested.v1'] as const;
export type NotificationEventType = typeof supportedEventTypes[number];
export interface NotificationEvent {
  eventId: string;
  contractVersion: 1;
  type: NotificationEventType;
  source: 'hydration-service' | 'training-service' | 'agenda-service';
  recipientUserId: string;
  occurredAt: string;
  payload: { title: string; body: string };
}
export function validateEvent(value: unknown): NotificationEvent {
  if (!value || typeof value !== 'object') throw new ApiError(400, 'INVALID_EVENT', 'Event must be an object');
  const event = value as Record<string, unknown>;
  if (typeof event.eventId !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(event.eventId)) throw new ApiError(400, 'INVALID_EVENT', 'eventId is invalid');
  if (event.contractVersion !== 1 || typeof event.type !== 'string' || !supportedEventTypes.includes(event.type as NotificationEventType)) throw new ApiError(400, 'UNSUPPORTED_EVENT', 'Unsupported notification event contract');
  if (!['hydration-service', 'training-service', 'agenda-service'].includes(String(event.source)) || typeof event.recipientUserId !== 'string' || !/^[a-f0-9]{24}$/.test(event.recipientUserId)) throw new ApiError(400, 'INVALID_EVENT', 'Event source or recipient is invalid');
  if (typeof event.occurredAt !== 'string' || Number.isNaN(new Date(event.occurredAt).getTime())) throw new ApiError(400, 'INVALID_EVENT', 'occurredAt must be an ISO instant');
  const payload = event.payload;
  if (!payload || typeof payload !== 'object' || typeof (payload as Record<string, unknown>).title !== 'string' || typeof (payload as Record<string, unknown>).body !== 'string') throw new ApiError(400, 'INVALID_EVENT', 'Event payload must contain title and body');
  const title = (payload as Record<string, string>).title.trim(), body = (payload as Record<string, string>).body.trim();
  if (!title || title.length > 200 || !body || body.length > 2000) throw new ApiError(400, 'INVALID_EVENT', 'Event payload size is invalid');
  return { eventId: event.eventId, contractVersion: 1, type: event.type as NotificationEventType, source: event.source as NotificationEvent['source'], recipientUserId: event.recipientUserId, occurredAt: event.occurredAt, payload: { title, body } };
}
export function newEventId() { return randomUUID(); }
