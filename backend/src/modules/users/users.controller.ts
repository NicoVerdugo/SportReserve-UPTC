/**
 * @file users.controller.ts
 * @module users
 * @description Controladores HTTP para la gestión de usuarios en SportReserve-UPTC.
 * Maneja las solicitudes entrantes, delega la lógica de negocio al servicio
 * correspondiente y retorna respuestas estandarizadas. Todas las rutas
 * de este módulo requieren rol ADMIN.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as usersService from './users.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

/**
 * Obtiene la lista paginada de usuarios con filtros opcionales.
 *
 * @route   GET /api/users
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Query params:
 *   - `page` {number} Número de página (por defecto: 1).
 *   - `limit` {number} Registros por página (por defecto: 10).
 *   - `search` {string} Búsqueda por nombre o correo.
 *   - `role` {'ADMIN'|'USER'} Filtro por rol.
 *   - `status` {'active'|'inactive'|'blocked'} Filtro por estado.
 * @param {Response} res - Respuesta HTTP con lista paginada de usuarios.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 */
export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await usersService.getAll({
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 10,
      search: search ? String(search) : undefined,
      role: role as 'ADMIN' | 'USER' | undefined,
      status: status as 'active' | 'inactive' | 'blocked' | undefined,
    });
    paginatedResponse(res, result.users, result.pagination, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un usuario específico por su ID de MongoDB.
 *
 * @route   GET /api/users/:id
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP con los datos del usuario.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el usuario no existe.
 */
export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.getById(req.params['id']!);
    successResponse(res, user, 'User retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza los datos básicos de un usuario (nombre, apellido, teléfono, avatar).
 *
 * @route   PUT /api/users/:id
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id`. Body: {@link UpdateUserDto}.
 * @param {Response} res - Respuesta HTTP con el usuario actualizado.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el usuario no existe.
 */
export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.update(req.params['id']!, req.body);
    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina permanentemente un usuario del sistema.
 *
 * @route   DELETE /api/users/:id
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id` (MongoId).
 * @param {Response} res - Respuesta HTTP confirmando la eliminación.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el usuario no existe.
 */
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await usersService.deleteUser(req.params['id']!);
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el estado de la cuenta de un usuario.
 *
 * @route   PATCH /api/users/:id/status
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id`. Body: `{ status: 'active'|'inactive'|'blocked' }`.
 * @param {Response} res - Respuesta HTTP con el usuario actualizado.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el usuario no existe.
 */
export const updateStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.updateStatus(req.params['id']!, req.body.status);
    successResponse(res, user, 'User status updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el rol de un usuario dentro del sistema.
 *
 * @route   PATCH /api/users/:id/role
 * @access  Admin
 *
 * @param {AuthRequest} req - Solicitud autenticada. Params: `id`. Body: `{ role: 'ADMIN'|'USER' }`.
 * @param {Response} res - Respuesta HTTP con el usuario actualizado.
 * @param {NextFunction} next - Middleware de manejo de errores.
 * @returns {Promise<void>}
 *
 * @throws {404} Si el usuario no existe.
 */
export const updateRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.updateRole(req.params['id']!, req.body.role);
    successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    next(error);
  }
};