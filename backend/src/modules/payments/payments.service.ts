/**
 * @file payments.service.ts
 * @module payments
 * @description Capa de lógica de negocio para la gestión de pagos en SportReserve-UPTC.
 * Gestiona la creación de pagos vinculados a reservas, consultas paginadas y
 * la actualización de estado con propagación automática al estado de la reserva asociada.
 *
 * Ciclo de vida del pago:
 * - `pending`  → estado inicial al crear el pago.
 * - `paid`     → pago confirmado; la reserva pasa a `'confirmed'`.
 * - `rejected` → pago rechazado; la reserva pasa a `'cancelled'`.
 * - `refunded` → pago reembolsado; la reserva pasa a `'cancelled'`.
 */

import Payment from './payment.model';
import Reservation from '../reservations/reservation.model';
import { IPayment } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * DTO para la creación de un nuevo pago.
 *
 * @interface CreatePaymentDto
 * @property {string} reservationId                       - ID de la reserva a pagar (MongoId).
 * @property {'card'|'paypal'|'transfer'|'cash'} method  - Método de pago seleccionado.
 * @property {string} [transactionId]                     - ID externo de transacción (opcional; se genera UUID si se omite).
 */
export interface CreatePaymentDto {
  reservationId: string;
  method: 'card' | 'paypal' | 'transfer' | 'cash';
  transactionId?: string;
}

/**
 * Parámetros de filtrado y paginación para consultas de pagos.
 *
 * @interface PaymentFilters
 * @property {number} [page=1]    - Número de página.
 * @property {number} [limit=10]  - Registros por página.
 * @property {string} [userId]    - Filtro por usuario propietario del pago.
 * @property {string} [status]    - Filtro por estado del pago.
 * @property {string} [method]    - Filtro por método de pago.
 */
export interface PaymentFilters {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  method?: string;
}

/**
 * Crea un nuevo pago para una reserva del usuario especificado.
 *
 * Proceso de validación:
 * 1. Verifica que la reserva exista y pertenezca al usuario.
 * 2. Valida que la reserva no esté cancelada.
 * 3. Detecta si ya existe un pago activo (`pending` o `paid`) para la reserva.
 * 4. Crea el pago con el monto tomado de `reservation.totalPrice`.
 * 5. Genera un `transactionId` UUID si no se provee uno externo.
 * 6. Vincula el pago a la reserva actualizando `reservation.paymentId`.
 *
 * @param {string} userId             - ID del usuario que realiza el pago.
 * @param {CreatePaymentDto} dto      - Datos del pago a crear.
 * @returns {Promise<IPayment>} El pago creado en estado `'pending'`.
 *
 * @throws {Error} `404` si la reserva no existe o no pertenece al usuario.
 * @throws {Error} `400` si la reserva está cancelada.
 * @throws {Error} `409` si ya existe un pago activo para esa reserva.
 *
 * @example
 * const payment = await create('userId123', {
 *   reservationId: 'resId456',
 *   method: 'card',
 * });
 */
export const create = async (
  userId: string,
  dto: CreatePaymentDto
): Promise<IPayment> => {
  const reservation = await Reservation.findOne({
    _id: dto.reservationId,
    userId,
  });

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status === 'cancelled') {
    throw Object.assign(new Error('Cannot create payment for a cancelled reservation'), {
      statusCode: 400,
    });
  }

  // Evita duplicados: verifica si ya existe un pago activo para esta reserva
  const existingPayment = await Payment.findOne({
    reservationId: dto.reservationId,
    status: { $in: ['pending', 'paid'] },
  });

  if (existingPayment) {
    throw Object.assign(
      new Error('A payment already exists for this reservation'),
      { statusCode: 409 }
    );
  }

  const payment = await Payment.create({
    reservationId: dto.reservationId,
    userId,
    amount: reservation.totalPrice, // Monto tomado directamente de la reserva
    currency: 'COP',
    method: dto.method,
    transactionId: dto.transactionId || uuidv4(), // UUID como fallback si no se provee
    status: 'pending',
  });

  // Vincula el pago a la reserva para trazabilidad
  reservation.paymentId = payment._id;
  await reservation.save();

  return payment;
};

/**
 * Obtiene la lista paginada de pagos de un usuario específico.
 *
 * Incluye populate de la reserva asociada (`date`, `startTime`, `endTime`, `totalHours`, `fieldId`).
 * Ordenado por fecha de creación descendente.
 *
 * @param {string} userId             - ID del usuario propietario de los pagos.
 * @param {PaymentFilters} filters    - Criterios de filtrado y paginación.
 * @returns {Promise<{ payments: IPayment[]; pagination: object }>}
 */
export const getByUser = async (userId: string, filters: PaymentFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IPayment> = { userId };

  if (filters.status) query['status'] = filters.status;
  if (filters.method) query['method'] = filters.method;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('reservationId', 'date startTime endTime totalHours fieldId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Obtiene la lista paginada de todos los pagos del sistema (uso exclusivo ADMIN).
 *
 * Incluye populate anidado: usuario → reserva → cancha (`name`, `sportType`).
 * Permite filtrar por usuario, estado y método de pago.
 *
 * @param {PaymentFilters} filters - Criterios de filtrado y paginación.
 * @returns {Promise<{ payments: IPayment[]; pagination: object }>}
 */
export const getAll = async (filters: PaymentFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IPayment> = {};

  if (filters.userId) query['userId'] = filters.userId;
  if (filters.status) query['status'] = filters.status;
  if (filters.method) query['method'] = filters.method;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'reservationId',
        select: 'date startTime endTime totalHours fieldId',
        populate: { path: 'fieldId', select: 'name sportType' }, // Populate anidado: reserva → cancha
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Busca y retorna un pago por su ID con populate completo de usuario y reserva.
 *
 * Si se proporciona `userId`, actúa como filtro adicional para restringir
 * el acceso de usuarios no administradores a sus propios pagos.
 *
 * @param {string} id        - ID del pago (MongoId).
 * @param {string} [userId]  - ID del usuario para restricción de acceso (omitir para ADMIN).
 * @returns {Promise<IPayment>} El pago con datos de usuario y reserva (con cancha anidada) populados.
 *
 * @throws {Error} `404` si el pago no existe o no pertenece al usuario.
 */
export const getById = async (id: string, userId?: string): Promise<IPayment> => {
  const query: FilterQuery<IPayment> = { _id: id };
  if (userId) query['userId'] = userId;

  const payment = await Payment.findOne(query)
    .populate('userId', 'firstName lastName email')
    .populate({
      path: 'reservationId',
      populate: { path: 'fieldId', select: 'name sportType location' },
    });

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  return payment;
};

/**
 * Actualiza el estado de un pago y propaga el cambio a la reserva asociada.
 *
 * Efectos secundarios sobre la reserva según el nuevo estado:
 * - `'paid'`     → reserva pasa a `'confirmed'` (pago exitoso).
 * - `'refunded'` → reserva pasa a `'cancelled'` (devolución procesada).
 * - `'rejected'` → reserva pasa a `'cancelled'` (pago rechazado).
 *
 * @param {string} id                                       - ID del pago a actualizar.
 * @param {'pending'|'paid'|'rejected'|'refunded'} status  - Nuevo estado del pago.
 * @param {string} [receipt]                                - URL o referencia del comprobante (opcional).
 * @returns {Promise<IPayment>} El pago con el estado actualizado.
 *
 * @throws {Error} `404` si el pago no existe.
 *
 * @example
 * // Confirmar pago → reserva pasa a 'confirmed'
 * await updateStatus('paymentId123', 'paid', 'https://receipts.example.com/abc');
 *
 * // Rechazar pago → reserva pasa a 'cancelled'
 * await updateStatus('paymentId123', 'rejected');
 */
export const updateStatus = async (
  id: string,
  status: 'pending' | 'paid' | 'rejected' | 'refunded',
  receipt?: string
): Promise<IPayment> => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  payment.status = status;
  if (receipt) payment.receipt = receipt;

  // Pago confirmado → confirmar la reserva asociada
  if (status === 'paid') {
    await Reservation.findByIdAndUpdate(payment.reservationId, { status: 'confirmed' });
  }

  // Pago reembolsado o rechazado → cancelar la reserva asociada
  if (status === 'refunded' || status === 'rejected') {
    await Reservation.findByIdAndUpdate(payment.reservationId, { status: 'cancelled' });
  }

  await payment.save();
  return payment;
};




