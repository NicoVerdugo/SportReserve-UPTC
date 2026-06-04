import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as fieldsService from './fields.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

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
