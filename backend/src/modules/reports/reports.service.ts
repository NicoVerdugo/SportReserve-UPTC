import Payment from '../payments/payment.model';
import Reservation from '../reservations/reservation.model';
import SportField from '../fields/field.model';

export interface RevenueReportFilters {
  dateFrom: string;
  dateTo: string;
}

export interface ReservationsReportFilters {
  dateFrom?: string;
  dateTo?: string;
  fieldId?: string;
  status?: string;
}

export const getRevenueReport = async (filters: RevenueReportFilters) => {
  const dateFrom = new Date(filters.dateFrom);
  const dateTo = new Date(filters.dateTo);
  dateTo.setHours(23, 59, 59, 999);

  const [
    dailyRevenue,
    paymentsByMethod,
    totalSummary,
    topFields,
  ] = await Promise.all([
    // Daily revenue breakdown
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
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
    // Revenue by payment method
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: '$method',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Total summary
    Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    // Top fields by revenue
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: dateFrom, $lte: dateTo },
        },
      },
      {
        $lookup: {
          from: 'reservations',
          localField: 'reservationId',
          foreignField: '_id',
          as: 'reservation',
        },
      },
      { $unwind: '$reservation' },
      {
        $group: {
          _id: '$reservation.fieldId',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'sportfields',
          localField: '_id',
          foreignField: '_id',
          as: 'field',
        },
      },
      { $unwind: '$field' },
      {
        $project: {
          fieldName: '$field.name',
          sportType: '$field.sportType',
          revenue: 1,
          count: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const totalRevenue = totalSummary
    .filter((s: { _id: string; total: number }) => s._id === 'paid')
    .reduce((acc: number, s: { total: number }) => acc + s.total, 0);

  const totalTransactions = totalSummary.reduce(
    (acc: number, s: { count: number }) => acc + s.count,
    0
  );

  return {
    period: {
      from: filters.dateFrom,
      to: filters.dateTo,
    },
    summary: {
      totalRevenue,
      totalTransactions,
      byStatus: totalSummary,
    },
    dailyRevenue: dailyRevenue.map((d: { _id: { year: number; month: number; day: number }; revenue: number; count: number }) => ({
      date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
      revenue: d.revenue,
      transactions: d.count,
    })),
    paymentsByMethod,
    topFields,
  };
};

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

  const [
    reservationsByStatus,
    reservationsByDay,
    reservationsByField,
    totalSummary,
  ] = await Promise.all([
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
    Reservation.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$fieldId',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
          totalHours: { $sum: '$totalHours' },
        },
      },
      {
        $lookup: {
          from: 'sportfields',
          localField: '_id',
          foreignField: '_id',
          as: 'field',
        },
      },
      { $unwind: '$field' },
      {
        $project: {
          fieldName: '$field.name',
          sportType: '$field.sportType',
          count: 1,
          revenue: 1,
          totalHours: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
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
    period: {
      from: filters.dateFrom,
      to: filters.dateTo,
    },
    summary: totalSummary[0] || {
      totalCount: 0,
      totalRevenue: 0,
      totalHours: 0,
      avgPrice: 0,
    },
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

export const getOccupancyReport = async () => {
  const fields = await SportField.find({ status: 'active' });

  const occupancyData = await Promise.all(
    fields.map(async (field) => {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const [totalSlots, confirmedSlots, pendingSlots] = await Promise.all([
        // Total possible slots per day based on schedule
        Promise.resolve(
          field.schedule.reduce((acc, slot) => {
            const openMinutes = parseInt(slot.openTime.split(':')[0]!) * 60 +
              parseInt(slot.openTime.split(':')[1]!);
            const closeMinutes = parseInt(slot.closeTime.split(':')[0]!) * 60 +
              parseInt(slot.closeTime.split(':')[1]!);
            return acc + Math.floor((closeMinutes - openMinutes) / 60);
          }, 0) * 30
        ), // Approx: avg slots over 30 days
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
      const occupancyRate =
        totalSlots > 0 ? Math.round((occupied / totalSlots) * 100) : 0;

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
      ? Math.round(
          occupancyData.reduce((acc, d) => acc + d.occupancyRate, 0) /
            occupancyData.length
        )
      : 0;

  return {
    period: 'Last 30 days',
    averageOccupancyRate: avgOccupancy,
    fields: occupancyData.sort((a, b) => b.occupancyRate - a.occupancyRate),
  };
};
