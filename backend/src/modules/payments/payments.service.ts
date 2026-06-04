import Payment from './payment.model';
import Reservation from '../reservations/reservation.model';
import { IPayment } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePaymentDto {
  reservationId: string;
  method: 'card' | 'paypal' | 'transfer' | 'cash';
  transactionId?: string;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  method?: string;
}

export const create = async (
  userId: string,
  dto: CreatePaymentDto
): Promise<IPayment> => {
  const reservation = await Reservation.findOne({
    _id: dto.reservationId,
    userId,
  });

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status === 'cancelled') {
    throw Object.assign(new Error('Cannot create payment for a cancelled reservation'), {
      statusCode: 400,
    });
  }

  // Check if payment already exists for this reservation
  const existingPayment = await Payment.findOne({
    reservationId: dto.reservationId,
    status: { $in: ['pending', 'paid'] },
  });

  if (existingPayment) {
    throw Object.assign(
      new Error('A payment already exists for this reservation'),
      { statusCode: 409 }
    );
  }

  const payment = await Payment.create({
    reservationId: dto.reservationId,
    userId,
    amount: reservation.totalPrice,
    currency: 'COP',
    method: dto.method,
    transactionId: dto.transactionId || uuidv4(),
    status: dto.method === 'cash' ? 'pending' : 'pending',
  });

  // Update reservation with payment reference
  reservation.paymentId = payment._id;
  await reservation.save();

  return payment;
};

export const getByUser = async (userId: string, filters: PaymentFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IPayment> = { userId };

  if (filters.status) query['status'] = filters.status;
  if (filters.method) query['method'] = filters.method;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('reservationId', 'date startTime endTime totalHours fieldId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getAll = async (filters: PaymentFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IPayment> = {};

  if (filters.userId) query['userId'] = filters.userId;
  if (filters.status) query['status'] = filters.status;
  if (filters.method) query['method'] = filters.method;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'reservationId',
        select: 'date startTime endTime totalHours fieldId',
        populate: { path: 'fieldId', select: 'name sportType' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ]);

  return {
    payments,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getById = async (id: string, userId?: string): Promise<IPayment> => {
  const query: FilterQuery<IPayment> = { _id: id };
  if (userId) query['userId'] = userId;

  const payment = await Payment.findOne(query)
    .populate('userId', 'firstName lastName email')
    .populate({
      path: 'reservationId',
      populate: { path: 'fieldId', select: 'name sportType location' },
    });

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  return payment;
};

export const updateStatus = async (
  id: string,
  status: 'pending' | 'paid' | 'rejected' | 'refunded',
  receipt?: string
): Promise<IPayment> => {
  const payment = await Payment.findById(id);

  if (!payment) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  payment.status = status;
  if (receipt) payment.receipt = receipt;

  // If payment is confirmed as paid, confirm the reservation
  if (status === 'paid') {
    await Reservation.findByIdAndUpdate(payment.reservationId, { status: 'confirmed' });
  }

  // If payment is refunded or rejected, cancel the reservation
  if (status === 'refunded' || status === 'rejected') {
    await Reservation.findByIdAndUpdate(payment.reservationId, { status: 'cancelled' });
  }

  await payment.save();
  return payment;
};
