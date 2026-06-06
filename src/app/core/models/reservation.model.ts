import { SportField } from './sport-field.model';
import { User } from './user.model';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  _id: string;
  userId: string | User;
  fieldId: string | SportField;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalPrice: number;
  status: ReservationStatus;
  paymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  fieldId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  fieldId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
