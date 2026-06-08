/**
 * @file notifications.service.ts
 * @module notifications
 * @description Capa de lógica de negocio para la gestión de notificaciones en SportReserve-UPTC.
 * Permite crear, consultar, marcar como leídas y eliminar notificaciones por usuario.
 *
 * Tipos de notificación soportados:
 * - `reservation` → eventos relacionados con reservas.
 * - `payment`     → confirmaciones o rechazos de pago.
 * - `system`      → mensajes administrativos del sistema.
 * - `reminder`    → recordatorios automáticos.
 */

import Notification from './notification.model';
import { INotification } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

/**
 * DTO para la creación de una nueva notificación.
 *
 * @interface CreateNotificationDto
 * @property {string} userId                                        - ID del usuario destinatario.
 * @property {string} title                                         - Título de la notificación.
 * @property {string} message                                       - Cuerpo del mensaje.
 * @property {'reservation'|'payment'|'system'|'reminder'} type    - Categoría de la notificación.
 * @property {Record<string, unknown>} [data]                       - Datos adicionales opcionales.
 */
export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'reservation' | 'payment' | 'system' | 'reminder';
  data?: Record<string, unknown>;
}

/**
 * Parámetros de filtrado y paginación para consultas de notificaciones.
 *
 * @interface NotificationFilters
 * @property {number} [page=1]    - Número de página.
 * @property {number} [limit=20]  - Registros por página.
 * @property {boolean} [isRead]   - Filtro por estado de lectura.
 * @property {string} [type]      - Filtro por tipo de notificación.
 */
export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

/**
 * Obtiene la lista paginada de notificaciones de un usuario, incluyendo el conteo de no leídas.
 *
 * Ordenado por fecha de creación descendente.
 *
 * @param {string} userId                  - ID del usuario propietario de las notificaciones.
 * @param {NotificationFilters} filters    - Criterios de filtrado y paginación.
 * @returns {Promise<{ notifications: INotification[]; pagination: object; unreadCount: number }>}
 *
 * @example
 * const result = await getByUser('userId123', { page: 1, isRead: false });
 * console.log(result.unreadCount); // Número de notificaciones sin leer
 */
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

/**
 * Marca una notificación específica como leída.
 *
 * Solo puede marcar notificaciones propias del usuario (filtro por `userId`).
 *
 * @param {string} id       - ID de la notificación (MongoId).
 * @param {string} userId   - ID del usuario propietario.
 * @returns {Promise<INotification>} La notificación actualizada con `isRead: true`.
 *
 * @throws {Error} `404` si la notificación no existe o no pertenece al usuario.
 *
 * @example
 * const updated = await markRead('notifId123', 'userId456');
 */
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

/**
 * Marca todas las notificaciones no leídas de un usuario como leídas.
 *
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{ modifiedCount: number }>} Número de notificaciones actualizadas.
 *
 * @example
 * const result = await markAllRead('userId123');
 * console.log(result.modifiedCount); // Ej: 5
 */
export const markAllRead = async (userId: string): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Crea una nueva notificación para un usuario.
 *
 * Utilizada internamente por otros módulos (pagos, reservas, sistema)
 * para notificar eventos al usuario destinatario.
 *
 * @param {CreateNotificationDto} dto - Datos de la notificación a crear.
 * @returns {Promise<INotification>} La notificación creada.
 *
 * @example
 * await create({
 *   userId: 'userId123',
 *   title: 'Pago confirmado',
 *   message: 'Tu pago ha sido procesado exitosamente.',
 *   type: 'payment',
 * });
 */
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

/**
 * Elimina una notificación específica del usuario.
 *
 * Solo puede eliminar notificaciones propias (filtro por `userId`).
 *
 * @param {string} id       - ID de la notificación (MongoId).
 * @param {string} userId   - ID del usuario propietario.
 * @returns {Promise<void>}
 *
 * @throws {Error} `404` si la notificación no existe o no pertenece al usuario.
 */
export const deleteNotification = async (
  id: string,
  userId: string
): Promise<void> => {
  const notification = await Notification.findOneAndDelete({ _id: id, userId });

  if (!notification) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
};

/**
 * Elimina todas las notificaciones leídas de un usuario.
 *
 * Útil para limpiar el historial de notificaciones ya revisadas.
 *
 * @param {string} userId - ID del usuario.
 * @returns {Promise<{ deletedCount: number }>} Número de notificaciones eliminadas.
 *
 * @example
 * const result = await deleteAllRead('userId123');
 * console.log(result.deletedCount); // Ej: 12
 */
export const deleteAllRead = async (userId: string): Promise<{ deletedCount: number }> => {
  const result = await Notification.deleteMany({ userId, isRead: true });
  return { deletedCount: result.deletedCount };
};

/**
 * Retorna el conteo de notificaciones no leídas de un usuario.
 *
 * Útil para mostrar badges o indicadores en la interfaz.
 *
 * @param {string} userId - ID del usuario.
 * @returns {Promise<number>} Número de notificaciones sin leer.
 *
 * @example
 * const count = await getUnreadCount('userId123');
 * console.log(count); // Ej: 3
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  return Notification.countDocuments({ userId, isRead: false });
};