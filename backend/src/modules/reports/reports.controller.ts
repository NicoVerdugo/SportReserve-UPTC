import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as reportsService from './reports.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export const getRevenueReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      errorResponse(res, 'dateFrom and dateTo query parameters are required', 400);
      return;
    }

    const report = await reportsService.getRevenueReport({
      dateFrom: String(dateFrom),
      dateTo: String(dateTo),
    });

    successResponse(res, report, 'Revenue report generated successfully');
  } catch (error) {
    next(error);
  }
};

export const getReservationsReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dateFrom, dateTo, fieldId, status } = req.query;

    const report = await reportsService.getReservationsReport({
      dateFrom: dateFrom ? String(dateFrom) : undefined,
      dateTo: dateTo ? String(dateTo) : undefined,
      fieldId: fieldId ? String(fieldId) : undefined,
      status: status ? String(status) : undefined,
    });

    successResponse(res, report, 'Reservations report generated successfully');
  } catch (error) {
    next(error);
  }
};

export const getOccupancyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const report = await reportsService.getOccupancyReport();
    successResponse(res, report, 'Occupancy report generated successfully');
  } catch (error) {
    next(error);
  }
};
