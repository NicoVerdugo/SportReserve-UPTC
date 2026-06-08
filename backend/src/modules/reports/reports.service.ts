/**
 * @file reports.service.ts
 * @module reports
 * @description Capa de lógica de negocio para la generación de reportes administrativos
 * en SportReserve-UPTC. Provee análisis de ingresos, reservas y ocupación de canchas
 * mediante agregaciones de MongoDB.
 *
 * Reportes disponibles:
 * - `getRevenueReport`      → Ingresos por período, método de pago y cancha.
 * - `getReservationsReport` → Reservas por estado, día y cancha.
 * - `getOccupancyReport`    → Tasa de ocupación de canchas activas (últimos 30 días).
 */

import Payment from '../payments/payment.model';
import Reservation from '../reservations/reservation.model';
import SportField from '../fields/field.model';

/**
 * Filtros requeridos para el reporte de ingresos.
 *
 * @interface RevenueReportFilters
 * @property {string} dateFrom - Fecha de inicio del período (formato YYYY-MM-DD).
 * @property {string} dateTo   - Fecha de fin del período (formato YYYY-MM-DD).
 */
export interface RevenueReportFilters {
  dateFrom: string;
  dateTo: string;
}

/**
 * Filtros opcionales para el reporte de reservas.
 *
 * @interface ReservationsReportFilters
 * @property {string} [dateFrom] - Fecha de inicio del período.
 * @property {string} [dateTo]   - Fecha de fin del período.
 * @property {string} [fieldId]  - Filtro por cancha específica (MongoId).
 * @property {string} [status]   - Filtro por estado de reserva.
 */
export interface ReservationsReportFilters {
  dateFrom?: string;
  dateTo?: string;
  fieldId?: string;
  status?: string;
}

/**
 * Genera el reporte de ingresos para un período dado.
 *
 * Incluye:
 * - Ingresos diarios (revenue + transacciones por día).
 * - Ingresos agrupados por método de pago.
 * - Resumen total por estado de pago.
 * - Top 10 canchas por ingresos generados.
 *
 * @param {RevenueReportFilters} filters - Rango de fechas del reporte.
 * @returns {Promise<object>} Reporte con período, resumen, ingresos diarios, por método y top canchas.
 *
 * @example
 * const report = await getRevenueReport({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
 * console.log(report.summary.totalRevenue);
 */
export const getRevenueReport = async (filters: RevenueReportFilters) => {
  const dateFrom = new Date(filters.dateFrom);
  const dateTo = new Date(filters.dateTo);
  dateTo.setHours(23, 59, 59, 999);

  const [dailyRevenue, paymentsByMethod, totalSummary, topFields] = await Promise.all([
    // Desglose de ingresos por día
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: dateFrom, $lte: dateTo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]),
    // Ingresos agrupados por método de pago
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: dateFrom, $lte: dateTo } } },
      {
        $group: {
          _id: '$method',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Resumen total por estado de pago
    Payment.aggregate([
      { $match: { createdAt: { $gte: dateFrom, $lte: dateTo } } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Top 10 canchas por ingresos (con lookup a reservas y canchas)
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: dateFrom, $lte: dateTo } } },
      { $lookup: { from: 'reservations', localField: 'reservationId', foreignField: '_id', as: 'reservation' } },
      { $unwind: '$reservation' },
      { $group: { _id: '$reservation.fieldId', revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'sportfields', localField: '_id', foreignField: '_id', as: 'field' } },
      { $unwind: '$field' },
      { $project: { fieldName: '$field.name', sportType: '$field.sportType', revenue: 1, count: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totalRevenue = totalSummary
    .filter((s: { _id: string; total: number }) => s._id === 'paid')
    .reduce((acc: number, s: { total: number }) => acc + s.total, 0);

  const totalTransactions = totalSummary.reduce(
    (acc: number, s: { count: number }) => acc + s.count, 0
  );

  return {
    period: { from: filters.dateFrom, to: filters.dateTo },
    summary: { totalRevenue, totalTransactions, byStatus: totalSummary },
    dailyRevenue: dailyRevenue.map((d: { _id: { year: number; month: number; day: number }; revenue: number; count: number }) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      revenue: d.revenue,
      transactions: d.count,
    })),
    paymentsByMethod,
    topFields,
  };
};

/**
 * Genera el reporte de reservas para un período y filtros opcionales.
 *
 * Incluye:
 * - Resumen global (total reservas, ingresos, horas y precio promedio).
 * - Reservas agrupadas por estado.
 * - Reservas agrupadas por día con día de la semana.
 * - Reservas agrupadas por cancha con ingresos y horas totales.
 *
 * @param {ReservationsReportFilters} filters - Criterios de filtrado del reporte.
 * @returns {Promise<object>} Reporte con período, resumen, por estado, por día y por cancha.
 *
 * @example
 * const report = await getReservationsReport({ dateFrom: '2026-01-01', status: 'confirmed' });
 * console.log(report.summary.totalCount);
 */
export const getReservationsReport = async (filters: ReservationsReportFilters) => {
  const matchQuery: Record<string, unknown> = {};

  if (filters.dateFrom || filters.dateTo) {
    matchQuery['date'] = {};
    if (filters.dateFrom) {
      (matchQuery['date'] as Record<string, unknown>)['$gte'] = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      (matchQuery['date'] as Record<string, unknown>)['$lte'] = dateTo;
    }
  }

  if (filters.fieldId) matchQuery['fieldId'] = filters.fieldId;
  if (filters.status) matchQuery['status'] = filters.status;

  const [reservationsByStatus, reservationsByDay, reservationsByField, totalSummary] =
    await Promise.all([
      // Agrupado por estado
      Reservation.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalHours: { $sum: '$totalHours' },
          },
        },
      ]),
      // Agrupado por día con día de la semana
      Reservation.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },
              dayOfWeek: { $dayOfWeek: '$date' },
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      // Agrupado por cancha con lookup
      Reservation.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$fieldId', count: { $sum: 1 }, revenue: { $sum: '$totalPrice' }, totalHours: { $sum: '$totalHours' } } },
        { $lookup: { from: 'sportfields', localField: '_id', foreignField: '_id', as: 'field' } },
        { $unwind: '$field' },
        { $project: { fieldName: '$field.name', sportType: '$field.sportType', count: 1, revenue: 1, totalHours: 1 } },
        { $sort: { count: -1 } },
      ]),
      // Resumen global
      Reservation.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            totalHours: { $sum: '$totalHours' },
            avgPrice: { $avg: '$totalPrice' },
          },
        },
      ]),
    ]);

  return {
    period: { from: filters.dateFrom, to: filters.dateTo },
    summary: totalSummary[0] || { totalCount: 0, totalRevenue: 0, totalHours: 0, avgPrice: 0 },
    byStatus: reservationsByStatus,
    byDay: reservationsByDay.map((d: { _id: { year: number; month: number; day: number; dayOfWeek: number }; count: number; revenue: number }) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      dayOfWeek: d._id.dayOfWeek,
      count: d.count,
      revenue: d.revenue,
    })),
    byField: reservationsByField,
  };
};

/**
 * Genera el reporte de ocupación de todas las canchas activas (últimos 30 días).
 *
 * Calcula para cada cancha:
 * - Slots totales disponibles según horario configurado.
 * - Slots confirmados y pendientes en el período.
 * - Tasa de ocupación en porcentaje (máximo 100%).
 *
 * Retorna las canchas ordenadas de mayor a menor ocupación.
 *
 * @returns {Promise<object>} Reporte con período, tasa promedio y datos por cancha.
 *
 * @example
 * const report = await getOccupancyReport();
 * console.log(report.averageOccupancyRate); // Ej: 72
 */
export const getOccupancyReport = async () => {
  const fields = await SportField.find({ status: 'active' });

  const occupancyData = await Promise.all(
    fields.map(async (field) => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const [totalSlots, confirmedSlots, pendingSlots] = await Promise.all([
        // Slots totales estimados según horario de la cancha (30 días)
        Promise.resolve(
          field.schedule.reduce((acc, slot) => {
            const openMinutes = parseInt(slot.openTime.split(':')[0]!) * 60 +
              parseInt(slot.openTime.split(':')[1]!);
            const closeMinutes = parseInt(slot.closeTime.split(':')[0]!) * 60 +
              parseInt(slot.closeTime.split(':')[1]!);
            return acc + Math.floor((closeMinutes - openMinutes) / 60);
          }, 0) * 30
        ),
        Reservation.countDocuments({
          fieldId: field._id,
          date: { $gte: thirtyDaysAgo, $lte: now },
          status: { $in: ['confirmed', 'completed'] },
        }),
        Reservation.countDocuments({
          fieldId: field._id,
          date: { $gte: thirtyDaysAgo, $lte: now },
          status: 'pending',
        }),
      ]);

      const occupied = confirmedSlots + pendingSlots;
      const occupancyRate = totalSlots > 0 ? Math.round((occupied / totalSlots) * 100) : 0;

      return {
        fieldId: field._id,
        fieldName: field.name,
        sportType: field.sportType,
        location: field.location,
        totalSlots,
        confirmedSlots,
        pendingSlots,
        occupancyRate: Math.min(100, occupancyRate),
      };
    })
  );

  const avgOccupancy =
    occupancyData.length > 0
      ? Math.round(occupancyData.reduce((acc, d) => acc + d.occupancyRate, 0) / occupancyData.length)
      : 0;

  return {
    period: 'Last 30 days',
    averageOccupancyRate: avgOccupancy,
    fields: occupancyData.sort((a, b) => b.occupancyRate - a.occupancyRate),
  };
};