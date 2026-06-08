/**
 * @file payment.model.ts
 * @module payments
 * @description Modelo Mongoose para la entidad Pago en SportReserve-UPTC.
 * Registra los pagos asociados a reservas, incluyendo método, estado,
 * identificador de transacción y comprobante. Se integra con el módulo
 * de reservas para mantener la consistencia del ciclo de vida de una reserva.
 */

import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../../interfaces';

/**
 * Esquema Mongoose para el modelo Pago.
 *
 * Campos principales:
 * - `reservationId`: Referencia a la reserva asociada (requerida).
 * - `userId`: Referencia al usuario que realiza el pago (requerido).
 * - `amount`: Monto del pago en la moneda especificada (no negativo).
 * - `currency`: Código de moneda ISO 4217 (por defecto `'COP'`, almacenado en mayúsculas).
 * - `method`: Método de pago — `'card'`, `'paypal'`, `'transfer'` o `'cash'`.
 * - `status`: Estado del pago — `'pending'`, `'paid'`, `'rejected'` o `'refunded'`
 *   (por defecto `'pending'`).
 * - `transactionId`: Identificador externo de la transacción (generado con UUID si no se provee).
 * - `receipt`: URL o referencia del comprobante de pago (opcional).
 *
 * Índices:
 * - `(userId, status)`: consultas de pagos por usuario y estado.
 * - `reservationId`: búsqueda de pagos por reserva.
 * - `status`: filtrado global por estado de pago.
 *
 * Opciones:
 * - `timestamps: true` agrega automáticamente `createdAt` y `updatedAt`.
 */
const paymentSchema = new Schema<IPayment>(
  {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'COP',
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['card', 'paypal', 'transfer', 'cash'],
        message: 'Payment method must be one of: card, paypal, transfer, cash',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'rejected', 'refunded'],
        message: 'Status must be one of: pending, paid, rejected, refunded',
      },
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receipt: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para consultas de pagos por usuario filtrados por estado
paymentSchema.index({ userId: 1, status: 1 });
// Índice para buscar el pago asociado a una reserva específica
paymentSchema.index({ reservationId: 1 });
// Índice para filtrado global de pagos por estado
paymentSchema.index({ status: 1 });

/**
 * Modelo Mongoose para la entidad Pago.
 * Exportado como default para uso en servicios y otras capas de la aplicación.
 */
const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;