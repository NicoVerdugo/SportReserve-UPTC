import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { SportsFieldsService } from '../../../sports-fields/services/sports-fields';
import { ReservationsService } from '../../services/reservations';
import { NotificationService } from '../../../../core/services/notification';
import { SportField, TimeSlot } from '../../../../core/models/sport-field.model';
import { FormatCurrencyPipe } from '../../../../shared/pipes/format-currency-pipe';

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCardModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './create-reservation.html',
  styleUrl: './create-reservation.scss',
})
export class CreateReservation implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private fieldsService = inject(SportsFieldsService);
  private reservationsService = inject(ReservationsService);
  private notification = inject(NotificationService);

  field = signal<SportField | null>(null);
  availability = signal<TimeSlot[]>([]);
  selectedDate = signal<Date | null>(null);
  selectedSlot = signal<TimeSlot | null>(null);
  loadingField = signal(false);
  loadingSlots = signal(false);
  submitting = signal(false);

  minDate = new Date();

  form = this.fb.group({
    notes: [''],
  });

  totalHours = computed(() => {
    const slot = this.selectedSlot();
    if (!slot) return 0;
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  });

  totalPrice = computed(() => {
    const f = this.field();
    return f ? this.totalHours() * f.pricePerHour : 0;
  });

  availableSlots = computed(() => {
    const slots = this.availability();
    return Array.isArray(slots) ? slots.filter(s => s.available) : [];
  });

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const fieldId = params.get('fieldId');
    const date = params.get('date');
    const startTime = params.get('startTime');
    const endTime = params.get('endTime');

    if (fieldId) {
      this.loadField(fieldId);
      if (date) {
        const d = new Date(date + 'T00:00:00');
        this.selectedDate.set(d);
        this.loadSlots(fieldId, date);
        if (startTime && endTime) {
          this.selectedSlot.set({ startTime, endTime, available: true });
        }
      }
    } else {
      this.router.navigate(['/fields']);
    }
  }

  private loadField(id: string): void {
    this.loadingField.set(true);
    this.fieldsService.getById(id).subscribe({
      next: (res) => { this.field.set(res.data); this.loadingField.set(false); },
      error: () => { this.notification.error('No se encontró la cancha'); this.router.navigate(['/fields']); },
    });
  }

  onDateChange(date: Date | null): void {
    this.selectedDate.set(date);
    this.selectedSlot.set(null);
    const f = this.field();
    if (date && f) {
      const iso = date.toISOString().split('T')[0];
      this.loadSlots(f._id, iso);
    }
  }

  private loadSlots(fieldId: string, date: string): void {
    this.loadingSlots.set(true);
    this.fieldsService.getAvailability(fieldId, date).subscribe({
      next: (res) => { this.availability.set(Array.isArray(res.data) ? res.data : []); this.loadingSlots.set(false); },
      error: () => { this.notification.error('Error al cargar disponibilidad'); this.loadingSlots.set(false); },
    });
  }

  selectSlot(slot: TimeSlot): void {
    this.selectedSlot.set(slot);
  }

  isSlotSelected(slot: TimeSlot): boolean {
    const s = this.selectedSlot();
    return !!s && s.startTime === slot.startTime && s.endTime === slot.endTime;
  }

  onSubmit(): void {
    const f = this.field();
    const d = this.selectedDate();
    const slot = this.selectedSlot();
    if (!f || !d || !slot) {
      this.notification.warning('Selecciona una fecha y horario');
      return;
    }

    this.submitting.set(true);
    this.reservationsService.create({
      fieldId: f._id,
      date: d.toISOString().split('T')[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      notes: this.form.value.notes ?? undefined,
    }).subscribe({
      next: () => {
        this.notification.success('Reserva creada exitosamente');
        this.router.navigate(['/dashboard/reservations']);
      },
      error: () => {
        this.notification.error('Error al crear la reserva');
        this.submitting.set(false);
      },
    });
  }

  goBack(): void { this.router.navigate(['/fields']); }
}
