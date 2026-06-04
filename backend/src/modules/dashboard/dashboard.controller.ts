import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as dashboardService from './dashboard.service';
import { successResponse } from '../../utils/response.utils';

export const getAdminStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await dashboardService.getAdminStats();
    successResponse(res, stats, 'Admin dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const stats = await dashboardService.getUserStats(String(req.user._id));
    successResponse(res, stats, 'User dashboard stats retrieved successfully');
  } catch (error) {
    next(error);
  }
};
