/**
 * @file fields.service.ts
 * @module fields
 * @description Capa de lógica de negocio para la gestión de canchas deportivas en SportReserve-UPTC.
 * Provee funciones para consultar, crear, actualizar, eliminar canchas y calcular
 * la disponibilidad horaria cruzando el horario configurado con las reservas existentes.
 */

import SportField from './field.model';
import Reservation from '../reservations/reservation.model';
import { ISportField } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

/**
 * Parámetros de filtrado y paginación para la consulta de canchas.
 *
 * @interface FieldFilters
 * @property {number} [page=1]       - Número de página para la paginación.
 * @property {number} [limit=10]     - Cantidad de registros por página.
 * @property {string} [search]       - Texto de búsqueda (usa índice $text en nombre y ubicación).
 * @property {string} [sportType]    - Filtro por tipo de deporte.
 * @property {string} [status]       - Filtro por estado operativo de la cancha.
 */
export interface FieldFilters {
  page?: number;
  limit?: number;
  search?: string;
  sportType?: string;
  status?: string;
}

/**
 * DTO para la creación de una nueva cancha deportiva.
 * Todos los campos requeridos deben estar presentes.
 *
 * @interface CreateFieldDto
 * @property {string} name                        - Nombre de la cancha.
 * @property {'football'|'basketball'|'volleyball'|'tennis'|'multiple'} sportType - Tipo de deporte.
 * @property {string} location                    - Ubicación física de la cancha.
 * @property {string} [description]               - Descripción opcional.
 * @property {string[]} [images]                  - URLs o base64 de imágenes.
 * @property {number} capacity                    - Capacidad máxima de personas.
 * @property {number} pricePerHour                - Precio por hora de uso.
 * @property {Array<{dayOfWeek: number; openTime: string; closeTime: string}>} [schedule] - Horarios por día.
 * @property {'active'|'inactive'|'maintenance'} [status] - Estado operativo (por defecto: 'active').
 */
export interface CreateFieldDto {
  name: string;
  sportType: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'multiple';
  location: string;
  description?: string;
  images?: string[];
  capacity: number;
  pricePerHour: number;
  schedule?: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>;
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * DTO para la actualización parcial de una cancha.
 * Extiende {@link CreateFieldDto} haciendo todos los campos opcionales.
 *
 * @interface UpdateFieldDto
 */
export interface UpdateFieldDto extends Partial<CreateFieldDto> {}

/**
 * Representa un slot horario de disponibilidad de una cancha.
 *
 * @interface TimeSlot
 * @property {string} startTime  - Hora de inicio del slot en formato HH:mm.
 * @property {string} endTime    - Hora de fin del slot en formato HH:mm (startTime + 1 hora).
 * @property {boolean} available - `true` si el slot está libre, `false` si ya está reservado.
 */
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

/**
 * Genera un array de horas de inicio de slots de 1 hora dentro de un rango horario.
 *
 * Divide el intervalo [openTime, closeTime] en bloques de 60 minutos,
 * devolviendo la hora de inicio de cada bloque en formato HH:mm.
 *
 * @param {string} openTime  - Hora de apertura en formato HH:mm.
 * @param {string} closeTime - Hora de cierre en formato HH:mm.
 * @returns {string[]} Array de horas de inicio disponibles (e.g. ['08:00', '09:00', '10:00']).
 *
 * @example
 * generateTimeSlots('08:00', '11:00');
 * // → ['08:00', '09:00', '10:00']
 */
const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let current = openHour * 60 + (openMin || 0);
  const end = closeHour * 60 + (closeMin || 0);

  while (current + 60 <= end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    current += 60;
  }

  return slots;
};

/**
 * Obtiene una lista paginada de canchas aplicando filtros opcionales.
 *
 * Usa búsqueda de texto completo (`$text`) cuando se proporciona `search`,
 * aprovechando el índice de texto definido en `name` y `location`.
 *
 * @param {FieldFilters} filters - Criterios de búsqueda y paginación.
 * @returns {Promise<{ fields: ISportField[]; pagination: object }>} Lista de canchas y metadatos de paginación.
 *
 * @example
 * const result = await getAll({ page: 1, limit: 5, sportType: 'football', status: 'active' });
 */
export const getAll = async (filters: FieldFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<ISportField> = {};

  // Búsqueda de texto completo usando el índice compuesto name + location
  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }
  if (filters.sportType) query['sportType'] = filters.sportType;
  if (filters.status) query['status'] = filters.status;

  const [fields, total] = await Promise.all([
    SportField.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SportField.countDocuments(query),
  ]);

  return {
    fields,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Busca y retorna una cancha por su ID de MongoDB.
 *
 * @param {string} id - ID de la cancha (MongoId).
 * @returns {Promise<ISportField>} El documento de la cancha encontrada.
 *
 * @throws {Error} Con `statusCode: 404` si la cancha no existe.
 */
export const getById = async (id: string): Promise<ISportField> => {
  const field = await SportField.findById(id);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }
  return field;
};

/**
 * Crea y persiste una nueva cancha deportiva en la base de datos.
 *
 * @param {CreateFieldDto} dto - Datos de la nueva cancha.
 * @returns {Promise<ISportField>} El documento de la cancha creada.
 *
 * @example
 * const field = await create({ name: 'Cancha A', sportType: 'football', location: 'Bloque X', capacity: 22, pricePerHour: 50000 });
 */
export const create = async (dto: CreateFieldDto): Promise<ISportField> => {
  const field = await SportField.create(dto);
  return field;
};

/**
 * Actualiza los datos de una cancha existente.
 *
 * Usa `runValidators: true` para aplicar las validaciones del esquema Mongoose
 * y retorna el documento actualizado con `new: true`.
 *
 * @param {string} id          - ID de la cancha a actualizar.
 * @param {UpdateFieldDto} dto - Campos a modificar (todos opcionales).
 * @returns {Promise<ISportField>} La cancha con los datos actualizados.
 *
 * @throws {Error} Con `statusCode: 404` si la cancha no existe.
 */
export const update = async (id: string, dto: UpdateFieldDto): Promise<ISportField> => {
  const field = await SportField.findByIdAndUpdate(id, dto, {
    new: true,
    runValidators: true,
  });

  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  return field;
};

/**
 * Elimina permanentemente una cancha de la base de datos.
 *
 * @param {string} id - ID de la cancha a eliminar.
 * @returns {Promise<void>}
 *
 * @throws {Error} Con `statusCode: 404` si la cancha no existe.
 */
export const deleteField = async (id: string): Promise<void> => {
  const field = await SportField.findByIdAndDelete(id);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }
};

/**
 * Calcula los slots de disponibilidad horaria de una cancha para una fecha específica.
 *
 * Algoritmo:
 * 1. Verifica que la cancha exista y esté en estado `'active'`.
 * 2. Determina el día de la semana de la fecha solicitada (UTC).
 * 3. Busca el horario configurado para ese día en `field.schedule`.
 * 4. Genera slots de 1 hora dentro del rango [openTime, closeTime].
 * 5. Consulta las reservas existentes con estado `'pending'` o `'confirmed'`.
 * 6. Marca cada slot como `available: false` si existe solapamiento con alguna reserva.
 *
 * @param {string} fieldId - ID de la cancha.
 * @param {string} date    - Fecha en formato `YYYY-MM-DD`.
 * @returns {Promise<TimeSlot[]>} Array de slots con su disponibilidad.
 *   Retorna array vacío si la cancha no tiene horario configurado para ese día.
 *
 * @throws {Error} Con `statusCode: 404` si la cancha no existe.
 * @throws {Error} Con `statusCode: 400` si la cancha no está activa.
 *
 * @example
 * const slots = await getAvailability('64abc123...', '2026-06-15');
 * // → [{ startTime: '08:00', endTime: '09:00', available: true }, ...]
 */
export const getAvailability = async (
  fieldId: string,
  date: string
): Promise<TimeSlot[]> => {
  const field = await SportField.findById(fieldId);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  if (field.status !== 'active') {
    throw Object.assign(
      new Error(`Field is not available (status: ${field.status})`),
      { statusCode: 400 }
    );
  }

  const requestedDate = new Date(date + 'T00:00:00Z');
  const dayOfWeek = requestedDate.getUTCDay();

  // Busca si existe horario configurado para el día de la semana solicitado
  const scheduleForDay = field.schedule.find((s) => s.dayOfWeek === dayOfWeek);

  // Si no hay horario para ese día, la cancha no está disponible
  if (!scheduleForDay) {
    return [];
  }

  const allStartTimes = generateTimeSlots(scheduleForDay.openTime, scheduleForDay.closeTime);

  // Consulta reservas activas (pending o confirmed) para este día
  const startOfDay = new Date(date + 'T00:00:00Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const existingReservations = await Reservation.find({
    fieldId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
  }).select('startTime endTime');

  // Mapea cada slot y determina su disponibilidad verificando solapamiento
  const timeSlots: TimeSlot[] = allStartTimes.map((startTime) => {
    const [h, m] = startTime.split(':').map(Number);
    const endHour = h + 1;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // Un slot está ocupado si alguna reserva existente se solapa con él
    const isOccupied = existingReservations.some((reservation) => {
      return (
        reservation.startTime < endTime && reservation.endTime > startTime
      );
    });

    return {
      startTime,
      endTime,
      available: !isOccupied,
    };
  });

  return timeSlots;
};