import Reservation from './reservation.model';
import SportField from '../fields/field.model';
import { IReservation } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

export interface CreateReservationDto {
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ReservationFilters {
  page?: number;
  limit?: number;
  userId?: string;
  fieldId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

export const create = async (
  userId: string,
  dto: CreateReservationDto
): Promise<IReservation> => {
  const field = await SportField.findById(dto.fieldId);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  if (field.status !== 'active') {
    throw Object.assign(
      new Error(`Field is not available for reservations (status: ${field.status})`),
      { statusCode: 400 }
    );
  }

  const startMinutes = timeToMinutes(dto.startTime);
  const endMinutes = timeToMinutes(dto.endTime);

  if (endMinutes <= startMinutes) {
    throw Object.assign(new Error('End time must be after start time'), { statusCode: 400 });
  }

  const totalHours = (endMinutes - startMinutes) / 60;

  if (totalHours < 0.5) {
    throw Object.assign(new Error('Minimum reservation duration is 30 minutes'), {
      statusCode: 400,
    });
  }

  // Check field schedule
  const requestedDate = new Date(dto.date);
  const dayOfWeek = requestedDate.getDay();
  const scheduleForDay = field.schedule.find((s) => s.dayOfWeek === dayOfWeek);

  if (!scheduleForDay) {
    throw Object.assign(new Error('Field is not available on this day'), { statusCode: 400 });
  }

  const openMinutes = timeToMinutes(scheduleForDay.openTime);
  const closeMinutes = timeToMinutes(scheduleForDay.closeTime);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw Object.assign(
      new Error(
        `Reservation must be within field operating hours: ${scheduleForDay.openTime} - ${scheduleForDay.closeTime}`
      ),
      { statusCode: 400 }
    );
  }

  // Check for conflicts
  const startOfDay = new Date(dto.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dto.date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflictingReservation = await Reservation.findOne({
    fieldId: dto.fieldId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        startTime: { $lt: dto.endTime },
        endTime: { $gt: dto.startTime },
      },
    ],
  });

  if (conflictingReservation) {
    throw Object.assign(
      new Error('This time slot is already reserved. Please choose a different time.'),
      { statusCode: 409 }
    );
  }

  const totalPrice = totalHours * field.pricePerHour;

  const reservation = await Reservation.create({
    userId,
    fieldId: dto.fieldId,
    date: new Date(dto.date),
    startTime: dto.startTime,
    endTime: dto.endTime,
    totalHours,
    totalPrice,
    notes: dto.notes,
  });

  return reservation;
};

export const getAll = async (filters: ReservationFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IReservation> = {};

  if (filters.userId) query['userId'] = filters.userId;
  if (filters.fieldId) query['fieldId'] = filters.fieldId;
  if (filters.status) query['status'] = filters.status;

  if (filters.dateFrom || filters.dateTo) {
    query['date'] = {};
    if (filters.dateFrom) query['date']['$gte'] = new Date(filters.dateFrom);
    if (filters.dateTo) query['date']['$lte'] = new Date(filters.dateTo);
  }

  const [reservations, total] = await Promise.all([
    Reservation.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('fieldId', 'name sportType location pricePerHour')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Reservation.countDocuments(query),
  ]);

  return {
    reservations,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getById = async (id: string, userId?: string): Promise<IReservation> => {
  const query: FilterQuery<IReservation> = { _id: id };
  if (userId) query['userId'] = userId;

  const reservation = await Reservation.findOne(query)
    .populate('userId', 'firstName lastName email phone')
    .populate('fieldId', 'name sportType location pricePerHour images');

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  return reservation;
};

export const cancel = async (id: string, userId?: string): Promise<IReservation> => {
  const query: FilterQuery<IReservation> = { _id: id };
  if (userId) query['userId'] = userId;

  const reservation = await Reservation.findOne(query);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status === 'cancelled') {
    throw Object.assign(new Error('Reservation is already cancelled'), { statusCode: 400 });
  }

  if (reservation.status === 'completed') {
    throw Object.assign(new Error('Cannot cancel a completed reservation'), { statusCode: 400 });
  }

  // Check if reservation is in the past
  const reservationDateTime = new Date(reservation.date);
  const [hours, minutes] = reservation.startTime.split(':').map(Number);
  reservationDateTime.setHours(hours, minutes, 0, 0);

  if (reservationDateTime <= new Date()) {
    throw Object.assign(new Error('Cannot cancel a past reservation'), { statusCode: 400 });
  }

  reservation.status = 'cancelled';
  await reservation.save();

  return reservation;
};

export const complete = async (id: string): Promise<IReservation> => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status !== 'confirmed') {
    throw Object.assign(
      new Error('Only confirmed reservations can be marked as completed'),
      { statusCode: 400 }
    );
  }

  reservation.status = 'completed';
  await reservation.save();

  return reservation;
};

export const confirm = async (id: string): Promise<IReservation> => {
  const reservation = await Reservation.findById(id);

  if (!reservation) {
    throw Object.assign(new Error('Reservation not found'), { statusCode: 404 });
  }

  if (reservation.status !== 'pending') {
    throw Object.assign(
      new Error('Only pending reservations can be confirmed'),
      { statusCode: 400 }
    );
  }

  reservation.status = 'confirmed';
  await reservation.save();

  return reservation;
};
