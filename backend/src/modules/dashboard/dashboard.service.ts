import mongoose from 'mongoose';
import User from '../users/user.model';
import SportField from '../fields/field.model';
import Reservation from '../reservations/reservation.model';
import Payment from '../payments/payment.model';
import Notification from '../notifications/notification.model';

export const getAdminStats = async () => {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalFields,
    activeReservationsCount,
    recentReservations,
    totalRevenue,
    revenueByMonth,
    reservationsByField,
  ] = await Promise.all([
    User.countDocuments({ role: 'USER' }),
    SportField.countDocuments({ status: 'active' }),
    Reservation.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
    Reservation.find({})
      .populate('userId', 'firstName lastName email')
      .populate('fieldId', 'name sportType')
      .sort({ createdAt: -1 })
      .limit(10),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Reservation.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: '$fieldId',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
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
          totalRevenue: 1,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Calculate occupancy rate
  const totalPossibleSlots = await Reservation.countDocuments({
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });

  const completedOrConfirmed = await Reservation.countDocuments({
    status: { $in: ['confirmed', 'completed'] },
  });

  const occupancyRate =
    totalPossibleSlots > 0
      ? Math.round((completedOrConfirmed / totalPossibleSlots) * 100)
      : 0;

  // Build monthly revenue with zero-fill for missing months
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const existing = revenueByMonth.find(
      (r: { _id: { year: number; month: number }; revenue: number; count: number }) =>
        r._id.year === year && r._id.month === month
    );

    monthlyRevenue.push({
      year,
      month,
      monthName: date.toLocaleString('es-CO', { month: 'short' }),
      revenue: existing ? existing.revenue : 0,
      count: existing ? existing.count : 0,
    });
  }

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    activeReservations: activeReservationsCount,
    totalUsers,
    totalFields,
    recentReservations,
    revenueByMonth: monthlyRevenue,
    reservationsByField,
    occupancyRate,
  };
};

export const getUserStats = async (userId: string) => {
  const now = new Date();

  const [
    upcomingReservations,
    totalReservations,
    totalSpentResult,
    unreadNotifications,
  ] = await Promise.all([
    Reservation.find({
      userId,
      status: { $in: ['pending', 'confirmed'] },
      date: { $gte: now },
    })
      .populate('fieldId', 'name sportType location pricePerHour images')
      .sort({ date: 1, startTime: 1 })
      .limit(5),
    Reservation.countDocuments({ userId }),
    Payment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    upcomingReservations,
    totalReservations,
    totalSpent: totalSpentResult[0]?.total || 0,
    unreadNotifications,
  };
};
