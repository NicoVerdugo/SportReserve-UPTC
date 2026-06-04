import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  status: 'active' | 'inactive' | 'blocked';
  avatar?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IScheduleSlot {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

export interface ISportField extends Document {
  _id: Types.ObjectId;
  name: string;
  sportType: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'multiple';
  location: string;
  description?: string;
  images: string[];
  capacity: number;
  pricePerHour: number;
  schedule: IScheduleSlot[];
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fieldId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  totalHours: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  reservationId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  method: 'card' | 'paypal' | 'transfer' | 'cash';
  status: 'pending' | 'paid' | 'rejected' | 'refunded';
  transactionId?: string;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'reservation' | 'payment' | 'system' | 'reminder';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}
