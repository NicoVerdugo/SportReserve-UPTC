import Notification from './notification.model';
import { INotification } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'reservation' | 'payment' | 'system' | 'reminder';
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export const getByUser = async (userId: string, filters: NotificationFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 20);

  const query: FilterQuery<INotification> = { userId };

  if (filters.isRead !== undefined) query['isRead'] = filters.isRead;
  if (filters.type) query['type'] = filters.type;

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ]);

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });

  return {
    notifications,
    pagination: buildPaginationMeta(total, page, limit),
    unreadCount,
  };
};

export const markRead = async (
  id: string,
  userId: string
): Promise<INotification> => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }

  return notification;
};

export const markAllRead = async (userId: string): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  return { modifiedCount: result.modifiedCount };
};

export const create = async (dto: CreateNotificationDto): Promise<INotification> => {
  const notification = await Notification.create({
    userId: dto.userId,
    title: dto.title,
    message: dto.message,
    type: dto.type,
    data: dto.data,
  });

  return notification;
};

export const deleteNotification = async (
  id: string,
  userId: string
): Promise<void> => {
  const notification = await Notification.findOneAndDelete({ _id: id, userId });

  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
};

export const deleteAllRead = async (userId: string): Promise<{ deletedCount: number }> => {
  const result = await Notification.deleteMany({ userId, isRead: true });
  return { deletedCount: result.deletedCount };
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, isRead: false });
};
