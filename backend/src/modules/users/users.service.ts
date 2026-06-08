/**
 * @file users.service.ts
 * @module users
 * @description Capa de lógica de negocio para la gestión de usuarios en SportReserve-UPTC.
 * Provee funciones para consultar, actualizar, eliminar y cambiar el estado/rol
 * de los usuarios, interactuando directamente con el modelo Mongoose.
 */

import User from './user.model';
import { IUser } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

/**
 * Parámetros de filtrado y paginación para la consulta de usuarios.
 *
 * @interface UserFilters
 * @property {number} [page=1]        - Número de página para la paginación.
 * @property {number} [limit=10]      - Cantidad de registros por página.
 * @property {string} [search]        - Texto de búsqueda (nombre o correo, insensible a mayúsculas).
 * @property {'ADMIN'|'USER'} [role]  - Filtro por rol del usuario.
 * @property {'active'|'inactive'|'blocked'} [status] - Filtro por estado de la cuenta.
 */
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'active' | 'inactive' | 'blocked';
}

/**
 * DTO para la actualización de datos básicos de un usuario.
 * Todos los campos son opcionales; solo se actualizan los que se provean.
 *
 * @interface UpdateUserDto
 * @property {string} [firstName] - Nuevo nombre del usuario.
 * @property {string} [lastName]  - Nuevo apellido del usuario.
 * @property {string} [phone]     - Nuevo teléfono de contacto.
 * @property {string} [avatar]    - Nueva URL del avatar.
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Obtiene una lista paginada de usuarios aplicando filtros opcionales.
 *
 * Construye dinámicamente la query de MongoDB según los filtros recibidos:
 * - `search`: búsqueda parcial e insensible en `firstName`, `lastName` y `email`.
 * - `role` / `status`: filtros exactos.
 * Los resultados se ordenan por fecha de creación descendente.
 *
 * @param {UserFilters} filters - Criterios de búsqueda y paginación.
 * @returns {Promise<{ users: IUser[]; pagination: object }>} Lista de usuarios y metadatos de paginación.
 *
 * @example
 * const result = await getAll({ page: 1, limit: 5, search: 'juan', role: 'USER' });
 * console.log(result.users);      // Array de usuarios
 * console.log(result.pagination); // { total, page, limit, totalPages }
 */
export const getAll = async (filters: UserFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IUser> = {};

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query['$or'] = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  if (filters.role) query['role'] = filters.role;
  if (filters.status) query['status'] = filters.status;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

/**
 * Busca y retorna un usuario por su ID de MongoDB.
 *
 * @param {string} id - ID del usuario (MongoId).
 * @returns {Promise<IUser>} El documento del usuario encontrado.
 *
 * @throws {Error} Con `statusCode: 404` si el usuario no existe.
 *
 * @example
 * const user = await getById('64abc123...');
 */
export const getById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

/**
 * Actualiza los datos básicos de un usuario (nombre, apellido, teléfono, avatar).
 *
 * Solo actualiza los campos presentes en el DTO; los campos ausentes
 * no modifican el documento existente. Usa `runValidators: true` para
 * aplicar las validaciones del esquema Mongoose.
 *
 * @param {string} id           - ID del usuario a actualizar.
 * @param {UpdateUserDto} dto   - Campos a modificar.
 * @returns {Promise<IUser>} El usuario con los datos actualizados.
 *
 * @throws {Error} Con `statusCode: 404` si el usuario no existe.
 *
 * @example
 * const updated = await update('64abc123...', { firstName: 'Carlos', phone: '3001234567' });
 */
export const update = async (id: string, dto: UpdateUserDto): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};

/**
 * Elimina permanentemente un usuario de la base de datos.
 *
 * @param {string} id - ID del usuario a eliminar.
 * @returns {Promise<void>}
 *
 * @throws {Error} Con `statusCode: 404` si el usuario no existe.
 *
 * @example
 * await deleteUser('64abc123...');
 */
export const deleteUser = async (id: string): Promise<void> => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
};

/**
 * Cambia el estado de la cuenta de un usuario.
 *
 * @param {string} id                                   - ID del usuario.
 * @param {'active'|'inactive'|'blocked'} status        - Nuevo estado a asignar.
 * @returns {Promise<IUser>} El usuario con el estado actualizado.
 *
 * @throws {Error} Con `statusCode: 404` si el usuario no existe.
 *
 * @example
 * const user = await updateStatus('64abc123...', 'blocked');
 */
export const updateStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'blocked'
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};

/**
 * Cambia el rol de un usuario dentro del sistema.
 *
 * @param {string} id               - ID del usuario.
 * @param {'ADMIN'|'USER'} role     - Nuevo rol a asignar.
 * @returns {Promise<IUser>} El usuario con el rol actualizado.
 *
 * @throws {Error} Con `statusCode: 404` si el usuario no existe.
 *
 * @example
 * const user = await updateRole('64abc123...', 'ADMIN');
 */
export const updateRole = async (
  id: string,
  role: 'ADMIN' | 'USER'
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};