import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReservationsService } from '../../services/reservations';
import { AuthService } from '../../../../core/services/auth';
import { NotificationService } from '../../../../core/services/notification';
import { Reservation, ReservationStatus } from '../../../../core/models/reservation.model';
import { SportField } from '../../../../core/models/sport-field.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './reservations-list.html',
  styleUrl: './reservations-list.scss',
})
export class ReservationsList implements OnInit {
  private reservationsService = inject(ReservationsService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  allReservations = signal<Reservation[]>([]);
  loading = signal(false);

  isAdmin = computed(() => this.authService.isAdmin());

  get upcoming(): Reservation[] {
    return this.allReservations().filter(r =>
      (r.status === 'pending' || r.status === 'confirmed') &&
      new Date(r.date) >= new Date()
    );
  }

  get history(): Reservation[] {
    return this.allReservations().filter(r => r.status === 'completed');
  }

  get cancelled(): Reservation[] {
    return this.allReservations().filter(r => r.status === 'cancelled');
  }

  get displayedColumns(): string[] {
    const base = ['field', 'date', 'time', 'status', 'price', 'actions'];
    return this.isAdmin() ? ['user', ...base] : base;
  }

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading.set(true);
    const obs = this.reservationsService.getAll();

    obs.subscribe({
      next: (res) => { this.allReservations.set(res.data); this.loading.set(false); },
      error: () => { this.notification.error('Error al cargar reservas'); this.loading.set(false); },
    });
  }

  onCancel(reservation: Reservation): void {
    if (!confirm('¿Cancelar esta reserva?')) return;
    this.reservationsService.cancel(reservation._id).subscribe({
      next: () => { this.notification.success('Reserva cancelada'); this.loadReservations(); },
      error: () => this.notification.error('Error al cancelar la reserva'),
    });
  }

  onView(id: string): void {
    this.router.navigate(['/dashboard/reservations', id]);
  }

  navigateToNew(): void {
    this.router.navigate(['/fields']);
  }

  getFieldName(fieldId: string | SportField): string {
    return typeof fieldId === 'object' ? fieldId.name : 'Cancha';
  }

  getUserName(userId: string | User): string {
    if (typeof userId === 'object') return `${userId.firstName} ${userId.lastName}`;
    return 'Usuario';
  }

  getStatusLabel(status: ReservationStatus): string {
    const map: Record<ReservationStatus, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada',
      cancelled: 'Cancelada', completed: 'Completada',
    };
    return map[status];
  }

  canCancel(r: Reservation): boolean {
    return (r.status === 'pending' || r.status === 'confirmed') &&
      new Date(r.date) > new Date();
  }
}
