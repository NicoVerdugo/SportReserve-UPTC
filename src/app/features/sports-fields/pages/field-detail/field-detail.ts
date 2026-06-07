import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { SportsFieldsService } from '../../services/sports-fields';
import { NotificationService } from '../../../../core/services/notification';
import { AuthService } from '../../../../core/services/auth';
import { SportField, TimeSlot } from '../../../../core/models/sport-field.model';
import { FormatCurrencyPipe } from '../../../../shared/pipes/format-currency-pipe';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './field-detail.html',
  styleUrl: './field-detail.scss',
})
export class FieldDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fieldsService = inject(SportsFieldsService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);

  field = signal<SportField | null>(null);
  loading = signal(false);
  selectedDate = signal<Date | null>(null);
  availability = signal<TimeSlot[]>([]);
  loadingSlots = signal(false);

  isAdmin = computed(() => this.authService.isAdmin());
  minDate = new Date();

  get sportLabel(): string {
    const labels: Record<string, string> = {
      football: 'Fútbol', basketball: 'Baloncesto',
      volleyball: 'Voleibol', tennis: 'Tenis', multiple: 'Múltiple',
    };
    return labels[this.field()?.sportType ?? ''] ?? '';
  }

  availableSlots = computed(() => {
    const slots = this.availability();
    return Array.isArray(slots) ? slots.filter(s => s.available) : [];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadField(id);
  }

  private loadField(id: string): void {
    this.loading.set(true);
    this.fieldsService.getById(id).subscribe({
      next: (res) => { this.field.set(res.data); this.loading.set(false); },
      error: () => { this.notification.error('Error al cargar la cancha'); this.loading.set(false); },
    });
  }

  loadAvailability(date: Date | null): void {
    const f = this.field();
    if (!date || !f) return;
    this.selectedDate.set(date);
    const iso = date.toISOString().split('T')[0];
    this.loadingSlots.set(true);
    this.fieldsService.getAvailability(f._id, iso).subscribe({
      next: (res) => { this.availability.set(Array.isArray(res.data) ? res.data : []); this.loadingSlots.set(false); },
      error: () => { this.notification.error('Error al cargar disponibilidad'); this.loadingSlots.set(false); },
    });
  }

  onReserve(slot: TimeSlot): void {
    const f = this.field();
    const d = this.selectedDate();
    if (!f || !d) return;
    this.router.navigate(['/dashboard/reservations/new'], {
      queryParams: {
        fieldId: f._id,
        date: d.toISOString().split('T')[0],
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });
  }

  goBack(): void { this.router.navigate(['/fields']); }

  editField(): void {
    const f = this.field();
    if (f) this.router.navigate(['/fields', f._id, 'edit']);
  }

  deleteField(): void {
    const f = this.field();
    if (!f || !confirm(`¿Eliminar la cancha "${f.name}"?`)) return;
    this.fieldsService.delete(f._id).subscribe({
      next: () => { this.notification.success('Cancha eliminada'); this.router.navigate(['/fields']); },
      error: () => this.notification.error('Error al eliminar'),
    });
  }
}
