/**
 * @file reservation.model.ts
 * @module reservations
 * @description Modelo Mongoose para la entidad Reserva en SportReserve-UPTC.
 * Define el esquema de reservas de canchas deportivas, incluyendo referencias
 * a usuarios, canchas y pagos, con índices optimizados para detección de conflictos.
 */

import mongoose, { Schema } from 'mongoose';
import { IReservation } from '../../interfaces';

/**
 * Esquema Mongoose para el modelo Reserva.
 *
 * Campos principales:
 * - `userId`: Referencia al usuario que realiza la reserva (requerido).
 * - `fieldId`: Referencia a la cancha deportiva reservada (requerido).
 * - `date`: Fecha de la reserva (requerida).
 * - `startTime`: Hora de inicio en formato HH:mm (requerida).
 * - `endTime`: Hora de fin en formato HH:mm (requerida).
 * - `totalHours`: Duración total en horas (mínimo 0.5 = 30 minutos).
 * - `totalPrice`: Precio total calculado (`totalHours * pricePerHour`).
 * - `status`: Estado de la reserva — `'pending'`, `'confirmed'`, `'cancelled'` o `'completed'`
 *   (por defecto `'pending'`).
 * - `paymentId`: Referencia opcional al pago asociado.
 * - `notes`: Observaciones adicionales opcionales (máx. 500 chars).
 *
 * Índices:
 * - Compuesto `(fieldId, date, startTime, endTime)`: optimiza la detección de conflictos de horario.
 * - `(userId, status)`: filtra reservas por usuario y estado eficientemente.
 * - `date`: consultas por fecha.
 *
 * Opciones:
 * - `timestamps: true` agrega automáticamente `createdAt` y `updatedAt`.
 */
const reservationSchema = new Schema<IReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'SportField',
      required: [true, 'Field ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'],
    },
    totalHours: {
      type: Number,
      required: [true, 'Total hours is required'],
      min: [0.5, 'Minimum reservation is 30 minutes'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Status must be one of: pending, confirmed, cancelled, completed',
      },
      default: 'pending',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para detección eficiente de conflictos de horario en una misma cancha y fecha
reservationSchema.index({ fieldId: 1, date: 1, startTime: 1, endTime: 1 });
// Índice para consultas de reservas por usuario y estado
reservationSchema.index({ userId: 1, status: 1 });
// Índice simple para consultas y filtros por fecha
reservationSchema.index({ date: 1 });

/**
 * Modelo Mongoose para la entidad Reserva.
 * Exportado como default para uso en servicios y otras capas de la aplicación.
 */
const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
export default Reservation;