/**
 * @file payments.controller.ts
 * @module payments
 * @description Controladores HTTP para la gestión de pagos en SportReserve-UPTC.
 * Maneja las solicitudes entrantes, aplica control de acceso por rol y delega
 * la lógica de negocio al servicio correspondiente.
 *
 * Acceso:
 * - Todas las rutas requieren autenticación JWT.
 * - `getAll` y `updateStatus`: solo ADMIN.
 * - `create`, `getMyPayments`, `getById`: USER o ADMIN.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as paymentsService from './payments.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

/**
 * Crea un nuevo pago asociado a una reserva del usuario autenticado.
 *
 * Valida que la reserva exista, pertenezca al usuario, no esté cancelada
 * y no tenga ya un pago activo. El monto se toma del `totalPrice` de la reserva.
 *
 * @route   POST /api/payments
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Body: {@link CreatePaymentDto}.
 * @param {Response} res - Respuesta HTTP 201 con el pago creado.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {401} Si el usuario no está autenticado.
 * @throws {404} Si la reserva no existe o no pertenece al usuario.
 * @throws {400} Si la reserva está cancelada.
 * @throws {409} Si ya existe un pago activo para esa reserva.
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
    const payment = await paymentsService.create(String(req.user._id), req.body);
    successResponse(res, payment, 'Payment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene la lista paginada de pagos del usuario autenticado.
 *
 * Permite filtrar por estado y método de pago. El `userId` se toma
 * automáticamente del token JWT, sin posibilidad de consultar pagos de otros usuarios.
 *
 * @route   GET /api/payments/my
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Query params:
 *   - `page` {number} Número de página (por defecto: 1).
 *   - `limit` {number} Registros por página (por defecto: 10).
 *   - `status` {string} Filtro por estado del pago.
 *   - `method` {string} Filtro por método de pago.
 * @param {Response} res - Respuesta HTTP con lista paginada de pagos del usuario.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {401} Si el usuario no está autenticado.
 */
export const getMyPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const { page, limit, status, method } = req.query;
    const result = await paymentsService.getByUser(String(req.user._id), {
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 10,
      status: status ? String(status) : undefined,
      method: method ? String(method) : undefined,
    });
    paginatedResponse(res, result.payments, result.pagination, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene la lista paginada de todos los pagos del sistema (solo ADMIN).
 *
 * Incluye populate de usuario y reserva (con cancha anidada).
 * Permite filtrar por usuario, estado y método de pago.
 *
 * @route   GET /api/payments
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Query params:
 *   - `page` {number} Número de página (por defecto: 1).
 *   - `limit` {number} Registros por página (por defecto: 10).
 *   - `userId` {string} Filtro por usuario.
 *   - `status` {string} Filtro por estado.
 *   - `method` {string} Filtro por método de pago.
 * @param {Response} res - Respuesta HTTP con lista paginada de todos los pagos.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 */
export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, userId, status, method } = req.query;
    const result = await paymentsService.getAll({
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 10,
      userId: userId ? String(userId) : undefined,
      status: status ? String(status) : undefined,
      method: method ? String(method) : undefined,
    });
    paginatedResponse(res, result.payments, result.pagination, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un pago específico por su ID.
 *
 * Control de acceso por rol:
 * - **ADMIN**: puede consultar cualquier pago.
 * - **USER**: solo puede consultar sus propios pagos.
 *
 * @route   GET /api/payments/:id
 * @access  Autenticado (USER o ADMIN)
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con los datos del pago (con populate de usuario y reserva).
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el pago no existe o no pertenece al usuario.
 */
export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ADMIN puede ver cualquier pago; USER solo los propios
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const payment = await paymentsService.getById(req.params['id']!, userId);
    successResponse(res, payment, 'Payment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado de un pago y propaga el cambio a la reserva asociada.
 *
 * Efectos secundarios según el nuevo estado:
 * - `'paid'`     → la reserva pasa a `'confirmed'`.
 * - `'refunded'` o `'rejected'` → la reserva pasa a `'cancelled'`.
 *
 * @route   PATCH /api/payments/:id/status
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id`. Body: `{ status, receipt? }`.
 * @param {Response} res - Respuesta HTTP con el pago actualizado.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el pago no existe.
 */
export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, receipt } = req.body;
    const payment = await paymentsService.updateStatus(req.params['id']!, status, receipt);
    successResponse(res, payment, 'Payment status updated successfully');
  } catch (error) {
    next(error);
  }
};