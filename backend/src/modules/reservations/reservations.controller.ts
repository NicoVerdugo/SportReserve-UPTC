/**
 * @file reservations.controller.ts
 * @module reservations
 * @description Controladores HTTP para la gestión de reservas en SportReserve-UPTC.
 * Implementa control de acceso por rol: los usuarios solo acceden a sus propias
 * reservas, mientras que los administradores tienen visibilidad y control total.
 *
 * Acceso:
 * - Todas las rutas requieren autenticación JWT.
 * - Operaciones de confirmación y cierre de reservas: solo ADMIN.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as reservationsService from './reservations.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

/**
 * Crea una nueva reserva para la cancha y horario especificados.
 *
 * Valida disponibilidad, horarios de operación y conflictos con reservas existentes
 * antes de persistir. El precio total se calcula automáticamente en el servicio.
 *
 * @route   POST /api/reservations
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Body: {@link CreateReservationDto}.
 * @param {Response} res - Respuesta HTTP 201 con la reserva creada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {401} Si el usuario no está autenticado.
 * @throws {400} Si la cancha no está activa o el horario es inválido.
 * @throws {409} Si el slot ya está reservado.
 */
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const reservation = await reservationsService.create(String(req.user._id), req.body);
    successResponse(res, reservation, 'Reservation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene la lista paginada de reservas con filtros opcionales.
 *
 * Control de acceso por rol:
 * - **ADMIN**: puede ver todas las reservas y filtrar por `userId`.
 * - **USER**: solo ve sus propias reservas (el `userId` se fija automáticamente).
 *
 * @route   GET /api/reservations
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Query params:
 *   - `page` {number} Número de página (por defecto: 1).
 *   - `limit` {number} Registros por página (por defecto: 10).
 *   - `fieldId` {string} Filtro por cancha.
 *   - `status` {string} Filtro por estado.
 *   - `dateFrom` {string} Fecha de inicio del rango (YYYY-MM-DD).
 *   - `dateTo` {string} Fecha de fin del rango (YYYY-MM-DD).
 *   - `userId` {string} Solo disponible para ADMIN.
 * @param {Response} res - Respuesta HTTP con lista paginada de reservas.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 */
export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, fieldId, status, dateFrom, dateTo } = req.query;

    // ADMIN puede filtrar por cualquier usuario; USER solo ve las suyas
    const userId =
      req.user?.role === 'ADMIN' ? (req.query['userId'] as string | undefined) : String(req.user?._id);

    const result = await reservationsService.getAll({
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 10,
      userId,
      fieldId: fieldId ? String(fieldId) : undefined,
      status: status ? String(status) : undefined,
      dateFrom: dateFrom ? String(dateFrom) : undefined,
      dateTo: dateTo ? String(dateTo) : undefined,
    });

    paginatedResponse(
      res,
      result.reservations,
      result.pagination,
      'Reservations retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una reserva específica por su ID.
 *
 * Control de acceso por rol:
 * - **ADMIN**: puede consultar cualquier reserva.
 * - **USER**: solo puede consultar sus propias reservas.
 *
 * @route   GET /api/reservations/:id
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con los datos de la reserva (con populate de usuario y cancha).
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si la reserva no existe o no pertenece al usuario.
 */
export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ADMIN puede ver cualquier reserva; USER solo las propias
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const reservation = await reservationsService.getById(req.params['id']!, userId);
    successResponse(res, reservation, 'Reservation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancela una reserva existente.
 *
 * Control de acceso por rol:
 * - **ADMIN**: puede cancelar cualquier reserva.
 * - **USER**: solo puede cancelar sus propias reservas y solo si aún no han iniciado.
 *
 * @route   PATCH /api/reservations/:id/cancel
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con la reserva cancelada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {400} Si la reserva ya está cancelada, completada o es pasada.
 * @throws {404} Si la reserva no existe o no pertenece al usuario.
 */
export const cancel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ADMIN puede cancelar cualquier reserva; USER solo las propias
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const reservation = await reservationsService.cancel(req.params['id']!, userId);
    successResponse(res, reservation, 'Reservation cancelled successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Marca una reserva confirmada como completada.
 * Solo aplicable a reservas en estado `'confirmed'`.
 *
 * @route   PATCH /api/reservations/:id/complete
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con la reserva completada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {400} Si la reserva no está en estado `'confirmed'`.
 * @throws {404} Si la reserva no existe.
 */
export const complete = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await reservationsService.complete(req.params['id']!);
    successResponse(res, reservation, 'Reservation marked as completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Confirma una reserva en estado pendiente.
 * Solo aplicable a reservas en estado `'pending'`.
 *
 * @route   PATCH /api/reservations/:id/confirm
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con la reserva confirmada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {400} Si la reserva no está en estado `'pending'`.
 * @throws {404} Si la reserva no existe.
 */
export const confirm = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reservation = await reservationsService.confirm(req.params['id']!);
    successResponse(res, reservation, 'Reservation confirmed successfully');
  } catch (error) {
    next(error);
  }
};