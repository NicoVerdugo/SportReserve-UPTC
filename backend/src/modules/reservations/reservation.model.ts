import mongoose, { Schema } from 'mongoose';
import { IReservation } from '../../interfaces';

const reservationSchema = new Schema<IReservation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    fieldId: {
      type: Schema.Types.ObjectId,
      ref: 'SportField',
      required: [true, 'Field ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm format'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm format'],
    },
    totalHours: {
      type: Number,
      required: [true, 'Total hours is required'],
      min: [0.5, 'Minimum reservation is 30 minutes'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'cancelled', 'completed'],
        message: 'Status must be one of: pending, confirmed, cancelled, completed',
      },
      default: 'pending',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for conflict detection
reservationSchema.index({ fieldId: 1, date: 1, startTime: 1, endTime: 1 });
reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ date: 1 });

const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
export default Reservation;
