/**
 * @file notifications.controller.ts
 * @module notifications
 * @description Controladores HTTP para la gestión de notificaciones en SportReserve-UPTC.
 * Todos los endpoints requieren autenticación; operan sobre las notificaciones
 * del usuario autenticado (`req.user._id`).
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as notificationsService from './notifications.service';
import { successResponse } from '../../utils/response.utils';

/**
 * GET /api/notifications
 * Retorna la lista paginada de notificaciones del usuario autenticado.
 * Soporta filtros por `isRead` y `type` vía query params.
 *
 * @param {AuthRequest} req - Request autenticado con `page`, `limit`, `isRead`, `type` en query.
 * @param {Response} res    - Lista de notificaciones, paginación y conteo de no leídas.
 */
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

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación específica como leída.
 *
 * @param {AuthRequest} req - Request autenticado con `id` en params.
 * @param {Response} res    - Notificación actualizada.
 */
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

/**
 * PATCH /api/notifications/mark-all-read
 * Marca todas las notificaciones no leídas del usuario autenticado como leídas.
 *
 * @param {AuthRequest} req - Request autenticado.
 * @param {Response} res    - Conteo de notificaciones modificadas.
 */
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

/**
 * DELETE /api/notifications/:id
 * Elimina una notificación específica del usuario autenticado.
 *
 * @param {AuthRequest} req - Request autenticado con `id` en params.
 * @param {Response} res    - Confirmación de eliminación.
 */
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

/**
 * DELETE /api/notifications/read
 * Elimina todas las notificaciones leídas del usuario autenticado.
 *
 * @param {AuthRequest} req - Request autenticado.
 * @param {Response} res    - Conteo de notificaciones eliminadas.
 */
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

/**
 * GET /api/notifications/unread-count
 * Retorna el número de notificaciones no leídas del usuario autenticado.
 * Útil para mostrar badges o indicadores en la interfaz.
 *
 * @param {AuthRequest} req - Request autenticado.
 * @param {Response} res    - Objeto `{ count: number }`.
 */
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