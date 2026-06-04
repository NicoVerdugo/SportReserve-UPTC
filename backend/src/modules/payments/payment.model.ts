import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../../interfaces';

const paymentSchema = new Schema<IPayment>(
  {
    reservationId: {
      type: Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation ID is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'COP',
      uppercase: true,
      trim: true,
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['card', 'paypal', 'transfer', 'cash'],
        message: 'Payment method must be one of: card, paypal, transfer, cash',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'rejected', 'refunded'],
        message: 'Status must be one of: pending, paid, rejected, refunded',
      },
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    receipt: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ reservationId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
