/**
 * @file reservations.service.ts
 * @module reservations
 * @description Capa de lógica de negocio para la gestión de reservas en SportReserve-UPTC.
 * Implementa validaciones de disponibilidad, detección de conflictos de horario,
 * cálculo automático de precio total y transiciones de estado del ciclo de vida
 * de una reserva: pending → confirmed → completed / cancelled.
 */

import Reservation from './reservation.model';
import SportField from '../fields/field.model';
import { IReservation } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

/**
 * DTO para la creación de una nueva reserva.
 *
 * @interface CreateReservationDto
 * @property {string} fieldId    - ID de la cancha a reservar (MongoId).
 * @property {string} date       - Fecha de la reserva en formato YYYY-MM-DD.
 * @property {string} startTime  - Hora de inicio en formato HH:mm.
 * @property {string} endTime    - Hora de fin en formato HH:mm.
 * @property {string} [notes]    - Observaciones opcionales del usuario.
 */
export interface CreateReservationDto {
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

/**
 * Parámetros de filtrado y paginación para la consulta de reservas.
 *
 * @interface ReservationFilters
 * @property {number} [page=1]      - Número de página.
 * @property {number} [limit=10]    - Registros por página.
 * @property {string} [userId]      - Filtro por usuario propietario de la reserva.
 * @property {string} [fieldId]     - Filtro por cancha.
 * @property {string} [status]      - Filtro por estado de la reserva.
 * @property {string} [dateFrom]    - Fecha de inicio del rango (YYYY-MM-DD).
 * @property {string} [dateTo]      - Fecha de fin del rango (YYYY-MM-DD).
 */
export interface ReservationFilters {
  page?: number;
  limit?: number;
  userId?: string;
  fieldId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Convierte una hora en formato HH:mm a minutos totales desde medianoche.
 * Utilizada internamente para comparaciones y cálculos de duración.
 *
 * @param {string} time - Hora en formato HH:mm.
 * @returns {number} Total de minutos desde las 00:00.
 *
 * @example
 * timeToMinutes('08:30'); // → 510
 * timeToMinutes('14:00'); // → 840
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Crea una nueva reserva para una cancha deportiva.
 *
 * Proceso de validación (en orden):
 * 1. Verifica que la cancha exista y esté en estado `'active'`.
 * 2. Valida que `endTime` sea posterior a `startTime` y que la duración mínima sea 30 minutos.
 * 3. Verifica que el día solicitado tenga horario configurado en la cancha.
 * 4. Confirma que el horario esté dentro del rango de operación de la cancha.
 * 5. Detecta conflictos con reservas existentes en estado `'pending'` o `'confirmed'`.
 * 6. Calcula el precio total: `totalHours * pricePerHour`.
 *
 * @param {string} userId               - ID del usuario que realiza la reserva.
 * @param {CreateReservationDto} dto    - Datos de la reserva a crear.
 * @returns {Promise<IReservation>} La reserva creada con estado inicial `'pending'`.
 *
 * @throws {Error} `404` si la cancha no existe.
 * @throws {Error} `400` si la cancha no está activa, el horario es inválido o fuera de rango.
 * @throws {Error} `409` si el slot ya está ocupado por otra reserva.
 *
 * @example
 * const reservation = await create('userId123', {
 *   fieldId: 'fieldId456',
 *   date: '2026-06-15',
 *   startTime: '09:00',
 *   endTime: '10:00',
 * });
 */
export const create = async (
  userId: string,
  dto: CreateReservationDto
): Promise<IReservation> => {
  const field = await SportField.findById(dto.fieldId);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  if (field.status !== 'active') {
    throw Object.assign(
      new Error(`Field is not available for reservations (status: ${field.status})`),
      { statusCode: 400 }
    );
  }

  const startMinutes = timeToMinutes(dto.startTime);
  const endMinutes = timeToMinutes(dto.endTime);

  if (endMinutes <= startMinutes) {
    throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
  }

  const totalHours = (endMinutes - startMinutes) / 60;

  if (totalHours < 0.5) {
    throw Object.assign(new Error('Minimum reservation duration is 30 minutes'), {
      statusCode: 400,
    });
  }

  // Verifica que el día solicitado tenga horario configurado
  const requestedDate = new Date(dto.date);
  const dayOfWeek = requestedDate.getDay();
  const scheduleForDay = field.schedule.find((s) => s.dayOfWeek === dayOfWeek);

  if (!scheduleForDay) {
    throw Object.assign(new Error('Field is not available on this day'), { statusCode: 400 });
  }

  const openMinutes = timeToMinutes(scheduleForDay.openTime);
  const closeMinutes = timeToMinutes(scheduleForDay.closeTime);

  // Valida que el horario solicitado esté dentro del rango de operación de la cancha
  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw Object.assign(
      new Error(
        `Reservation must be within field operating hours: ${scheduleForDay.openTime} - ${scheduleForDay.closeTime}`
      ),
      { statusCode: 400 }
    );
  }

  // Detecta solapamiento con reservas activas (pending o confirmed) en la misma fecha y cancha
  const startOfDay = new Date(dto.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dto.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflictingReservation = await Reservation.findOne({
    fieldId: dto.fieldId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        startTime: { $lt: dto.endTime },
        endTime: { $gt: dto.startTime },
      },
    ],
  });

  if (conflictingReservation) {
    throw Object.assign(
      new Error('This time slot is already reserved. Please choose a different time.'),
      { statusCode: 409 }
    );
  }

  // Calcula el precio total basado en la duración y el precio por hora de la cancha
  const totalPrice = totalHours * field.pricePerHour;

  const reservation = await Reservation.create({
    userId,
    fieldId: dto.fieldId,
    date: new Date(dto.date),
    startTime: dto.startTime,
    endTime: dto.endTime,
    totalHours,
    totalPrice,
    notes: dto.notes,
  });

  return reservation;
};

/**
 * Obtiene una lista paginada de reservas con filtros opcionales.
 *
 * Retorna reservas con populate de usuario (`firstName`, `lastName`, `email`)
 * y cancha (`name`, `sportType`, `location`, `pricePerHour`).
 * Ordenadas por fecha e hora de inicio descendente.
 *
 * @param {ReservationFilters} filters - Criterios de búsqueda y paginación.
 * @returns {Promise<{ reservations: IReservation[]; pagination: object }>}
 */
export const getAll = async (filters: ReservationFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IReservation> = {};

  if (filters.userId) query['userId'] = filters.userId;
  if (filters.fieldId) query['fieldId'] = filters.fieldId;
  if (filters.status) query['status'] = filters.status;

  // Construye filtro de rango de fechas si se proporciona alguno de los extremos
  if (filters.dateFrom || filters.dateTo) {
    query['date'] = {};
    if (filters.dateFrom) query['date']['$gte'] = new Date(filters.dateFrom);
    if (filters.dateTo) query['date']['$lte'] = new Date(filters.dateTo);
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('fieldId', 'name sportType location pricePerHour')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Reservation.countDocuments(query),
  ]);

  return {
    reservations,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Busca y retorna una reserva por su ID, con populate completo de usuario y cancha.
 *
 * Si se proporciona `userId`, actúa como filtro adicional para que un usuario
 * solo pueda acceder a sus propias reservas.
 *
 * @param {string} id          - ID de la reserva (MongoId).
 * @param {string} [userId]    - ID del usuario para restricción de acceso (omitir para ADMIN).
 * @returns {Promise<IReservation>} La reserva con datos de usuario y cancha populados.
 *
 * @throws {Error} `404` si la reserva no existe o no pertenece al usuario.
 */
export const getById = async (id: string, userId?: string): Promise<IReservation> => {
  const query: FilterQuery<IReservation> = { _id: id };
  if (userId) query['userId'] = userId;

  const reservation = await Reservation.findOne(query)
    .populate('userId', 'firstName lastName email phone')
    .populate('fieldId', 'name sportType location pricePerHour images');

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  return reservation;
};

/**
 * Cancela una reserva existente.
 *
 * Reglas de negocio:
 * - No se puede cancelar una reserva ya cancelada o completada.
 * - No se puede cancelar una reserva cuya hora de inicio ya pasó.
 * - Si se proporciona `userId`, solo se cancela si pertenece a ese usuario.
 *
 * @param {string} id        - ID de la reserva a cancelar.
 * @param {string} [userId]  - ID del usuario para restricción de acceso (omitir para ADMIN).
 * @returns {Promise<IReservation>} La reserva con estado `'cancelled'`.
 *
 * @throws {Error} `404` si la reserva no existe o no pertenece al usuario.
 * @throws {Error} `400` si la reserva ya está cancelada, completada o es pasada.
 */
export const cancel = async (id: string, userId?: string): Promise<IReservation> => {
  const query: FilterQuery<IReservation> = { _id: id };
  if (userId) query['userId'] = userId;

  const reservation = await Reservation.findOne(query);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status === 'cancelled') {
    throw Object.assign(new Error('Reservation is already cancelled'), { statusCode: 400 });
  }

  if (reservation.status === 'completed') {
    throw Object.assign(new Error('Cannot cancel a completed reservation'), { statusCode: 400 });
  }

  // Construye el datetime exacto de inicio para comparar con el momento actual
  const reservationDateTime = new Date(reservation.date);
  const [hours, minutes] = reservation.startTime.split(':').map(Number);
  reservationDateTime.setHours(hours, minutes, 0, 0);

  if (reservationDateTime <= new Date()) {
    throw Object.assign(new Error('Cannot cancel a past reservation'), { statusCode: 400 });
  }

  reservation.status = 'cancelled';
  await reservation.save();

  return reservation;
};

/**
 * Marca una reserva confirmada como completada.
 *
 * Solo se puede completar una reserva en estado `'confirmed'`.
 * Operación exclusiva de administradores.
 *
 * @param {string} id - ID de la reserva a completar.
 * @returns {Promise<IReservation>} La reserva con estado `'completed'`.
 *
 * @throws {Error} `404` si la reserva no existe.
 * @throws {Error} `400` si la reserva no está en estado `'confirmed'`.
 */
export const complete = async (id: string): Promise<IReservation> => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status !== 'confirmed') {
    throw Object.assign(
      new Error('Only confirmed reservations can be marked as completed'),
      { statusCode: 400 }
    );
  }

  reservation.status = 'completed';
  await reservation.save();

  return reservation;
};

/**
 * Confirma una reserva en estado pendiente.
 *
 * Solo se puede confirmar una reserva en estado `'pending'`.
 * Operación exclusiva de administradores.
 *
 * @param {string} id - ID de la reserva a confirmar.
 * @returns {Promise<IReservation>} La reserva con estado `'confirmed'`.
 *
 * @throws {Error} `404` si la reserva no existe.
 * @throws {Error} `400` si la reserva no está en estado `'pending'`.
 */
export const confirm = async (id: string): Promise<IReservation> => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status !== 'pending') {
    throw Object.assign(
      new Error('Only pending reservations can be confirmed'),
      { statusCode: 400 }
    );
  }

  reservation.status = 'confirmed';
  await reservation.save();

  return reservation;
};