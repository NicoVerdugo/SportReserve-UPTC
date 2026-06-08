/**
 * @file notification.model.ts
 * @module notifications
 * @description Modelo Mongoose para las notificaciones de usuarios en SportReserve-UPTC.
 *
 * Índices definidos:
 * - `{ userId, isRead }`     → optimiza consultas de notificaciones no leídas.
 * - `{ userId, createdAt }`  → optimiza ordenamiento cronológico por usuario.
 */

import mongoose, { Schema } from 'mongoose';
import { INotification } from '../../interfaces';

const notificationSchema = new Schema<INotification>(
  {
    /** ID del usuario destinatario (referencia a colección `User`). */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    /** Título de la notificación. Máximo 100 caracteres. */
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    /** Cuerpo del mensaje. Máximo 500 caracteres. */
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    /**
     * Categoría de la notificación.
     * - `reservation` → eventos de reserva.
     * - `payment`     → eventos de pago.
     * - `system`      → mensajes administrativos.
     * - `reminder`    → recordatorios automáticos.
     */
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['reservation', 'payment', 'system', 'reminder'],
        message: 'Type must be one of: reservation, payment, system, reminder',
      },
    },
    /** Indica si el usuario ya leyó la notificación. Por defecto `false`. */
    isRead: {
      type: Boolean,
      default: false,
    },
    /** Payload adicional libre asociado al evento (opcional). */
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;