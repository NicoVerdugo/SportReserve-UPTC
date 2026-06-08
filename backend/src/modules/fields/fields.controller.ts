/**
 * @file fields.controller.ts
 * @module fields
 * @description Controladores HTTP para la gestión de canchas deportivas en SportReserve-UPTC.
 * Maneja las solicitudes entrantes, delega la lógica de negocio al servicio
 * correspondiente y retorna respuestas estandarizadas.
 *
 * Acceso:
 * - Consultas (GET): públicas, no requieren autenticación.
 * - Mutaciones (POST, PUT, DELETE): requieren autenticación y rol ADMIN.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as fieldsService from './fields.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

/**
 * Obtiene la lista paginada de canchas con filtros opcionales.
 *
 * @route   GET /api/fields
 * @access  Público
 *
 * @param {Request} req - Solicitud HTTP. Query params:
 *   - `page` {number} Número de página (por defecto: 1).
 *   - `limit` {number} Registros por página (por defecto: 10).
 *   - `search` {string} Búsqueda por texto en nombre y ubicación.
 *   - `sportType` {string} Filtro por tipo de deporte.
 *   - `status` {string} Filtro por estado de la cancha.
 * @param {Response} res - Respuesta HTTP con lista paginada de canchas.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, sportType, status } = req.query;
    const result = await fieldsService.getAll({
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 10,
      search: search ? String(search) : undefined,
      sportType: sportType ? String(sportType) : undefined,
      status: status ? String(status) : undefined,
    });
    paginatedResponse(res, result.fields, result.pagination, 'Fields retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una cancha específica por su ID de MongoDB.
 *
 * @route   GET /api/fields/:id
 * @access  Público
 *
 * @param {Request} req - Solicitud HTTP. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con los datos de la cancha.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si la cancha no existe.
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const field = await fieldsService.getById(req.params['id']!);
    successResponse(res, field, 'Field retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una nueva cancha deportiva en el sistema.
 *
 * @route   POST /api/fields
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Body: {@link CreateFieldDto}.
 * @param {Response} res - Respuesta HTTP 201 con la cancha creada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 */
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const field = await fieldsService.create(req.body);
    successResponse(res, field, 'Field created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza los datos de una cancha existente.
 *
 * @route   PUT /api/fields/:id
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id`. Body: {@link UpdateFieldDto}.
 * @param {Response} res - Respuesta HTTP con la cancha actualizada.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si la cancha no existe.
 */
export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const field = await fieldsService.update(req.params['id']!, req.body);
    successResponse(res, field, 'Field updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina permanentemente una cancha del sistema.
 *
 * @route   DELETE /api/fields/:id
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP confirmando la eliminación.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si la cancha no existe.
 */
export const deleteField = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await fieldsService.deleteField(req.params['id']!);
    successResponse(res, null, 'Field deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene los slots de disponibilidad horaria de una cancha para una fecha específica.
 *
 * Verifica el horario configurado para el día de la semana correspondiente
 * y descuenta los slots ya reservados con estado `pending` o `confirmed`.
 *
 * @route   GET /api/fields/:id/availability
 * @access  Público
 *
 * @param {Request} req - Solicitud HTTP. Params: `id`. Query: `date` (YYYY-MM-DD, requerido).
 * @param {Response} res - Respuesta HTTP con array de {@link TimeSlot}.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {400} Si el parámetro `date` no se proporciona.
 * @throws {404} Si la cancha no existe.
 */
export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) {
      res.status(400).json({ success: false, message: 'Date query parameter is required' });
      return;
    }
    const slots = await fieldsService.getAvailability(req.params['id']!, String(date));
    successResponse(res, slots, 'Availability retrieved successfully');
  } catch (error) {
    next(error);
  }
};