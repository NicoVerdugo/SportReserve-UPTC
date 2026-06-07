import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../../core/services/notification';
import { SportField } from '../../../../core/models/sport-field.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-fields-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './fields-management.html',
  styleUrl: './fields-management.scss',
})
export class FieldsManagement implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notification = inject(NotificationService);

  fields = signal<SportField[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  displayedColumns = ['imagen', 'nombre', 'deporte', 'ubicacion', 'precio', 'estado', 'acciones'];

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.searchQuery()) params.search = this.searchQuery();
    this.http.get<any>(`${environment.apiUrl}/fields`, { params }).subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.fields.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Error al cargar canchas');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.loadFields();
  }

  onAdd(): void {
    this.router.navigate(['/fields/new']);
  }

  onEdit(field: SportField): void {
    this.router.navigate(['/fields', field._id, 'edit']);
  }

  onDelete(field: SportField): void {
    if (!confirm(`¿Eliminar la cancha "${field.name}"? Esta acción no se puede deshacer.`)) return;
    this.http.delete<any>(`${environment.apiUrl}/fields/${field._id}`).subscribe({
      next: () => {
        this.notification.success('Cancha eliminada');
        this.loadFields();
      },
      error: () => this.notification.error('Error al eliminar cancha'),
    });
  }

  onToggleStatus(field: SportField): void {
    const newStatus = field.status === 'active' ? 'inactive' : 'active';
    this.http.patch<any>(`${environment.apiUrl}/fields/${field._id}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.notification.success('Estado actualizado');
        this.loadFields();
      },
      error: () => this.notification.error('Error al cambiar estado'),
    });
  }

  getSportLabel(sport: string): string {
    const labels: Record<string, string> = {
      football: 'Fútbol',
      basketball: 'Baloncesto',
      volleyball: 'Voleibol',
      tennis: 'Tenis',
      multiple: 'Múltiple',
    };
    return labels[sport] ?? sport;
  }
}
