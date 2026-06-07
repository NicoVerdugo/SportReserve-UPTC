import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reservation, ReservationStatus } from '../../../../core/models/reservation.model';
import { SportField } from '../../../../core/models/sport-field.model';
import { FormatCurrencyPipe } from '../../../../shared/pipes/format-currency-pipe';

@Component({
  selector: 'app-reservation-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './reservation-card.html',
  styleUrl: './reservation-card.scss',
})
export class ReservationCard {
  reservation = input.required<Reservation>();
  cancelReservation = output<Reservation>();

  get fieldName(): string {
    const f = this.reservation().fieldId;
    return typeof f === 'object' ? (f as SportField).name : 'Cancha';
  }

  get canCancel(): boolean {
    const r = this.reservation();
    return (r.status === 'pending' || r.status === 'confirmed') &&
      new Date(r.date) > new Date();
  }

  getStatusLabel(status: ReservationStatus): string {
    const map: Record<ReservationStatus, string> = {
      pending: 'Pendiente', confirmed: 'Confirmada',
      cancelled: 'Cancelada', completed: 'Completada',
    };
    return map[status];
  }

  onCancel(): void {
    this.cancelReservation.emit(this.reservation());
  }
}
