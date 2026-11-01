import { Connection } from 'mongoose';
import { notificationSchema } from './notification.model';
import { preferenceSchema } from './preference.model';
import { processedEventSchema } from './processed-event.model';

export function createNotificationModels(connection: Connection) {
  return {
    Notification: connection.model('Notification', notificationSchema),
    Preference: connection.model('NotificationPreference', preferenceSchema),
    ProcessedEvent: connection.model('NotificationProcessedEvent', processedEventSchema),
  };
}
export type NotificationModels = ReturnType<typeof createNotificationModels>;
export async function initializeModels(models: NotificationModels) { await Promise.all(Object.values(models).map((model) => model.init())); }
