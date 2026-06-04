import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as reservationsService from './reservations.service';
import { successResponse, paginatedResponse } from '../../utils/response.utils';

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

export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, fieldId, status, dateFrom, dateTo } = req.query;

    // Regular users can only see their own reservations
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

export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Admin can see any reservation, users can only see their own
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const reservation = await reservationsService.getById(req.params['id']!, userId);
    successResponse(res, reservation, 'Reservation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const cancel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Admin can cancel any reservation, users can only cancel their own
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const reservation = await reservationsService.cancel(req.params['id']!, userId);
    successResponse(res, reservation, 'Reservation cancelled successfully');
  } catch (error) {
    next(error);
  }
};

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
