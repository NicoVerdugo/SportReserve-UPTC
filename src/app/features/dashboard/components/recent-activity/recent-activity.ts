import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Reservation, ReservationStatus } from '../../../../core/models/reservation.model';
import { SportField } from '../../../../core/models/sport-field.model';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-recent-activity',
  imports: [CommonModule, MatCardModule, MatTableModule, MatChipsModule, MatIconModule],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivity {
  reservations = input<Reservation[]>([]);

  displayedColumns = ['date', 'field', 'user', 'status', 'price'];

  getFieldName(fieldId: string | SportField): string {
    if (typeof fieldId === 'object' && fieldId !== null) return fieldId.name;
    return 'Cancha';
  }

  getUserName(userId: string | User): string {
    if (typeof userId === 'object' && userId !== null) {
      return `${userId.firstName} ${userId.lastName}`;
    }
    return 'Usuario';
  }

  getStatusLabel(status: ReservationStatus): string {
    const labels: Record<ReservationStatus, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    };
    return labels[status] ?? status;
  }

  getStatusClass(status: ReservationStatus): string {
    const classes: Record<ReservationStatus, string> = {
      pending: 'status--pending',
      confirmed: 'status--confirmed',
      cancelled: 'status--cancelled',
      completed: 'status--completed',
    };
    return classes[status] ?? '';
  }
}
