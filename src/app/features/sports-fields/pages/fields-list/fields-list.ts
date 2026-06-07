import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth';
import { SportsFieldsService, FieldFilters } from '../../services/sports-fields';
import { NotificationService } from '../../../../core/services/notification';
import { SportField } from '../../../../core/models/sport-field.model';
import { FieldCard } from '../../components/field-card/field-card';
import { FieldFilter, FieldFilterValues } from '../../components/field-filter/field-filter';

@Component({
  selector: 'app-fields-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FieldCard,
    FieldFilter,
  ],
  templateUrl: './fields-list.html',
  styleUrl: './fields-list.scss',
})
export class FieldsList implements OnInit {
  private fieldsService = inject(SportsFieldsService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);

  fields = signal<SportField[]>([]);
  loading = signal(false);
  filters = signal<FieldFilters>({});

  isAdmin = computed(() => this.authService.isAdmin());

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading.set(true);
    this.fieldsService.getAll(this.filters()).subscribe({
      next: (res) => {
        this.fields.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Error al cargar las canchas');
        this.loading.set(false);
      },
    });
  }

  onFilter(values: FieldFilterValues): void {
    this.filters.set({ ...values });
    this.loadFields();
  }

  onFieldClick(id: string): void {
    this.router.navigate(['/fields', id]);
  }

  onEditField(field: SportField): void {
    this.router.navigate(['/fields', field._id, 'edit']);
  }

  onDeleteField(field: SportField): void {
    if (!confirm(`¿Eliminar la cancha "${field.name}"?`)) return;
    this.fieldsService.delete(field._id).subscribe({
      next: () => {
        this.notification.success('Cancha eliminada');
        this.loadFields();
      },
      error: () => this.notification.error('Error al eliminar la cancha'),
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/fields/new']);
  }
}
