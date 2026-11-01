import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../config/errors';
import { RequestContext } from '../middlewares/auth.middleware';
import { NotificationService } from '../services/notification.service';
const context = (res: Response) => res.locals.context as RequestContext;
const work = (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };
function options(query: Request['query']) {
  const page = query.page === undefined ? 1 : Number(query.page), pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new ApiError(400, 'INVALID_PAGINATION', 'page must be positive and pageSize must be between 1 and 100');
  return { page, pageSize, unread: query.unread === 'true' };
}
export function createNotificationController(service: NotificationService) {
  return {
    list: work(async (req, res) => { res.json({ data: await service.list(context(res), options(req.query)) }); }),
    unreadCount: work(async (_req, res) => { res.json({ data: await service.unreadCount(context(res)) }); }),
    markRead: work(async (req, res) => { res.json({ data: await service.markRead(context(res), req.params.notificationId) }); }),
    markAllRead: work(async (_req, res) => { res.json({ data: await service.markAllRead(context(res)) }); }),
    getPreferences: work(async (_req, res) => { res.json({ data: await service.getPreferences(context(res)) }); }),
    setPreferences: work(async (req, res) => { res.json({ data: await service.setPreferences(context(res), req.body) }); }),
  };
}
