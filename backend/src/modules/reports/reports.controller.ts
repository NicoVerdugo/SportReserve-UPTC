/**
 * @file reports.controller.ts
 * @module reports
 * @description Controladores HTTP para la generación de reportes administrativos
 * en SportReserve-UPTC. Todos los endpoints son exclusivos para usuarios con rol ADMIN.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as reportsService from './reports.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

/**
 * GET /api/reports/revenue
 * Genera el reporte de ingresos para un período dado.
 * Requiere los query params `dateFrom` y `dateTo` (formato YYYY-MM-DD).
 *
 * @param {AuthRequest} req - Request con `dateFrom` y `dateTo` en query (obligatorios).
 * @param {Response} res    - Reporte de ingresos con desglose diario, por método y top canchas.
 */
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

/**
 * GET /api/reports/reservations
 * Genera el reporte de reservas con filtros opcionales de período, cancha y estado.
 *
 * @param {AuthRequest} req - Request con `dateFrom`, `dateTo`, `fieldId`, `status` en query (opcionales).
 * @param {Response} res    - Reporte de reservas con resumen, por estado, por día y por cancha.
 */
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

/**
 * GET /api/reports/occupancy
 * Genera el reporte de ocupación de todas las canchas activas en los últimos 30 días.
 * No requiere parámetros adicionales.
 *
 * @param {AuthRequest} req - Request autenticado como ADMIN.
 * @param {Response} res    - Reporte de ocupación con tasa promedio y datos por cancha.
 */
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