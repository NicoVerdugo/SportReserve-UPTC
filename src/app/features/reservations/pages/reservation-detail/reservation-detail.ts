import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ReservationsService } from '../../services/reservations';
import { AuthService } from '../../../../core/services/auth';
import { NotificationService } from '../../../../core/services/notification';
import { Reservation, ReservationStatus } from '../../../../core/models/reservation.model';
import { SportField } from '../../../../core/models/sport-field.model';
import { User } from '../../../../core/models/user.model';
import { FormatCurrencyPipe } from '../../../../shared/pipes/format-currency-pipe';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './reservation-detail.html',
  styleUrl: './reservation-detail.scss',
})
export class ReservationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationsService = inject(ReservationsService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  reservation = signal<Reservation | null>(null);
  loading = signal(false);
  acting = signal(false);

  get isAdmin() { return this.authService.isAdmin(); }

  get fieldName(): string {
    const r = this.reservation();
    if (!r) return '';
    return typeof r.fieldId === 'object' ? (r.fieldId as SportField).name : 'Cancha';
  }

  get userName(): string {
    const r = this.reservation();
    if (!r) return '';
    if (typeof r.userId === 'object') {
      const u = r.userId as User;
      return `${u.firstName} ${u.lastName}`;
    }
    return 'Usuario';
  }

  get canCancel(): boolean {
    const r = this.reservation();
    if (!r) return false;
    return (r.status === 'pending' || r.status === 'confirmed') &&
      new Date(r.date) > new Date();
  }

  get canComplete(): boolean {
    const r = this.reservation();
    return !!r && this.isAdmin && r.status === 'confirmed';
  }

  getStatusLabel(status: ReservationStatus): string {
    const map: Record<ReservationStatus, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada',
      cancelled: 'Cancelada', completed: 'Completada',
    };
    return map[status];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadReservation(id);
  }

  private loadReservation(id: string): void {
    this.loading.set(true);
    this.reservationsService.getById(id).subscribe({
      next: (res) => { this.reservation.set(res.data); this.loading.set(false); },
      error: () => { this.notification.error('Error al cargar la reserva'); this.loading.set(false); },
    });
  }

  onCancel(): void {
    const r = this.reservation();
    if (!r || !confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    this.acting.set(true);
    this.reservationsService.cancel(r._id).subscribe({
      next: (res) => { this.reservation.set(res.data); this.notification.success('Reserva cancelada'); this.acting.set(false); },
      error: () => { this.notification.error('Error al cancelar'); this.acting.set(false); },
    });
  }

  onComplete(): void {
    const r = this.reservation();
    if (!r) return;
    this.acting.set(true);
    this.reservationsService.complete(r._id).subscribe({
      next: (res) => { this.reservation.set(res.data); this.notification.success('Reserva completada'); this.acting.set(false); },
      error: () => { this.notification.error('Error al completar'); this.acting.set(false); },
    });
  }

  goBack(): void { this.router.navigate(['/dashboard/reservations']); }
}
