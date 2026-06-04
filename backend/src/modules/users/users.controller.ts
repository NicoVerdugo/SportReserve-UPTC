import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as usersService from './users.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

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
