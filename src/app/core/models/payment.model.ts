export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'refunded';
export type PaymentMethod = 'card' | 'paypal' | 'transfer' | 'cash';

export interface Payment {
  _id: string;
  reservationId: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  reservationId: string;
  method: PaymentMethod;
  amount: number;
}
