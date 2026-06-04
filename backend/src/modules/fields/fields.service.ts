import SportField from './field.model';
import Reservation from '../reservations/reservation.model';
import { ISportField } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

export interface FieldFilters {
  page?: number;
  limit?: number;
  search?: string;
  sportType?: string;
  status?: string;
}

export interface CreateFieldDto {
  name: string;
  sportType: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'multiple';
  location: string;
  description?: string;
  images?: string[];
  capacity: number;
  pricePerHour: number;
  schedule?: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateFieldDto extends Partial<CreateFieldDto> {}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);

  let current = openHour * 60 + (openMin || 0);
  const end = closeHour * 60 + (closeMin || 0);

  while (current + 60 <= end) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    current += 60;
  }

  return slots;
};

export const getAll = async (filters: FieldFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<ISportField> = {};

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }
  if (filters.sportType) query['sportType'] = filters.sportType;
  if (filters.status) query['status'] = filters.status;

  const [fields, total] = await Promise.all([
    SportField.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SportField.countDocuments(query),
  ]);

  return {
    fields,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getById = async (id: string): Promise<ISportField> => {
  const field = await SportField.findById(id);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }
  return field;
};

export const create = async (dto: CreateFieldDto): Promise<ISportField> => {
  const field = await SportField.create(dto);
  return field;
};

export const update = async (id: string, dto: UpdateFieldDto): Promise<ISportField> => {
  const field = await SportField.findByIdAndUpdate(id, dto, {
    new: true,
    runValidators: true,
  });

  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  return field;
};

export const deleteField = async (id: string): Promise<void> => {
  const field = await SportField.findByIdAndDelete(id);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }
};

export const getAvailability = async (
  fieldId: string,
  date: string
): Promise<TimeSlot[]> => {
  const field = await SportField.findById(fieldId);
  if (!field) {
    throw Object.assign(new Error('Field not found'), { statusCode: 404 });
  }

  if (field.status !== 'active') {
    throw Object.assign(
      new Error(`Field is not available (status: ${field.status})`),
      { statusCode: 400 }
    );
  }

  const requestedDate = new Date(date + 'T00:00:00Z');
  const dayOfWeek = requestedDate.getUTCDay();

  const scheduleForDay = field.schedule.find((s) => s.dayOfWeek === dayOfWeek);

  if (!scheduleForDay) {
    return [];
  }

  const allStartTimes = generateTimeSlots(scheduleForDay.openTime, scheduleForDay.closeTime);

  // Get existing reservations for this field on this date
  const startOfDay = new Date(date + 'T00:00:00Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const existingReservations = await Reservation.find({
    fieldId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
  }).select('startTime endTime');

  const timeSlots: TimeSlot[] = allStartTimes.map((startTime) => {
    const [h, m] = startTime.split(':').map(Number);
    const endHour = h + 1;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const isOccupied = existingReservations.some((reservation) => {
      // Check for overlap: existing reservation overlaps with this slot
      return (
        reservation.startTime < endTime && reservation.endTime > startTime
      );
    });

    return {
      startTime,
      endTime,
      available: !isOccupied,
    };
  });

  return timeSlots;
};
