import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { PaymentsService } from '../../services/payments';
import { PaymentForm } from '../../components/payment-form/payment-form';
import { PaymentSuccess } from '../../components/payment-success/payment-success';
import { NotificationService } from '../../../../core/services/notification';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PaymentForm,
    PaymentSuccess,
  ],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.scss',
})
export class PaymentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);

  reservationId = signal('');
  amount = signal(0);
  fieldName = signal('');
  reservationDate = signal('');

  selectedMethod = signal<'card' | 'paypal' | 'transfer'>('card');
  loading = signal(false);
  paymentSuccess = signal(false);
  confirmationNumber = signal('');

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.reservationId.set(params['reservationId'] ?? '');
      this.amount.set(Number(params['amount'] ?? 0));
      this.fieldName.set(params['fieldName'] ?? 'Cancha deportiva');
      this.reservationDate.set(params['date'] ?? '');
    });
  }

  onPay(): void {
    if (!this.reservationId()) {
      this.notification.error('No se encontró la reserva');
      return;
    }
    this.loading.set(true);
    const dto = {
      reservationId: this.reservationId(),
      method: this.selectedMethod(),
      amount: this.amount(),
    };
    this.paymentsService.createPayment(dto).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const txId = res?.data?.transactionId ?? `TXN-${Date.now()}`;
        this.confirmationNumber.set(txId);
        this.paymentSuccess.set(true);
        this.notification.success('¡Pago realizado exitosamente!');
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Error al procesar el pago');
      },
    });
  }

  onViewReservations(): void {
    this.router.navigate(['/dashboard/reservations']);
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/reservations']);
  }
}
