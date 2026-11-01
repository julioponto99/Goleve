import { Router } from 'express';
import { createNotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
export function createNotificationRoutes(service: NotificationService) {
  const router = Router(), controller = createNotificationController(service);
  router.get('/', controller.list);
  router.get('/unread-count', controller.unreadCount);
  router.post('/read-all', controller.markAllRead);
  router.get('/preferences', controller.getPreferences);
  router.put('/preferences', controller.setPreferences);
  router.post('/:notificationId/read', controller.markRead);
  return router;
}
