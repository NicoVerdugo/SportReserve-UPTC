import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as paymentsService from './payments.service';
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
    const payment = await paymentsService.create(String(req.user._id), req.body);
    successResponse(res, payment, 'Payment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

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

export const getById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.role === 'ADMIN' ? undefined : String(req.user?._id);
    const payment = await paymentsService.getById(req.params['id']!, userId);
    successResponse(res, payment, 'Payment retrieved successfully');
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
    const { status, receipt } = req.body;
    const payment = await paymentsService.updateStatus(req.params['id']!, status, receipt);
    successResponse(res, payment, 'Payment status updated successfully');
  } catch (error) {
    next(error);
  }
};
