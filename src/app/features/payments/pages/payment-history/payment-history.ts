import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaymentsService } from '../../services/payments';
import { Payment, PaymentStatus } from '../../../../core/models/payment.model';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.scss',
})
export class PaymentHistory implements OnInit {
  private paymentsService = inject(PaymentsService);

  allPayments = signal<Payment[]>([]);
  loading = signal(true);
  activeFilter = signal<'all' | PaymentStatus>('all');

  displayedColumns = ['reserva', 'fecha', 'monto', 'metodo', 'estado', 'comprobante'];

  filteredPayments = computed(() => {
    const filter = this.activeFilter();
    const payments = this.allPayments();
    if (filter === 'all') return payments;
    return payments.filter((p) => p.status === filter);
  });

  ngOnInit(): void {
    this.paymentsService.getMyPayments().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? [];
        this.allPayments.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(filter: 'all' | PaymentStatus): void {
    this.activeFilter.set(filter);
  }

  getStatusLabel(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      rejected: 'Rechazado',
      refunded: 'Reembolsado',
    };
    return map[status] ?? status;
  }

  getMethodLabel(method: string): string {
    const map: Record<string, string> = {
      card: 'Tarjeta',
      paypal: 'PayPal',
      transfer: 'Transferencia',
      cash: 'Efectivo',
    };
    return map[method] ?? method;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  viewReceipt(payment: Payment): void {
    if (payment.receipt) {
      window.open(payment.receipt, '_blank');
    } else {
      alert('Comprobante no disponible');
    }
  }
}
