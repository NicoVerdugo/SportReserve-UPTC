import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as notificationsService from './notifications.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

export const getMyNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { page, limit, isRead, type } = req.query;
    const result = await notificationsService.getByUser(String(req.user._id), {
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type: type ? String(type) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const notification = await notificationsService.markRead(
      req.params['id']!,
      String(req.user._id)
    );
    successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const result = await notificationsService.markAllRead(String(req.user._id));
    successResponse(res, result, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    await notificationsService.deleteNotification(req.params['id']!, String(req.user._id));
    successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAllRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const result = await notificationsService.deleteAllRead(String(req.user._id));
    successResponse(res, result, 'Read notifications deleted');
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const count = await notificationsService.getUnreadCount(String(req.user._id));
    successResponse(res, { count }, 'Unread count retrieved');
  } catch (error) {
    next(error);
  }
};
