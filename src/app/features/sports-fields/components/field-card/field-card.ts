import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SportField } from '../../../../core/models/sport-field.model';
import { FormatCurrencyPipe } from '../../../../shared/pipes/format-currency-pipe';

@Component({
  selector: 'app-field-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    FormatCurrencyPipe,
  ],
  templateUrl: './field-card.html',
  styleUrl: './field-card.scss',
})
export class FieldCard {
  field = input.required<SportField>();
  showActions = input<boolean>(false);

  editField = output<SportField>();
  deleteField = output<SportField>();

  private router = inject(Router);

  onCardClick(): void {
    this.router.navigate(['/fields', this.field()._id]);
  }

  onReserve(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/dashboard/reservations/new'], {
      queryParams: { fieldId: this.field()._id },
    });
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editField.emit(this.field());
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteField.emit(this.field());
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

  getSportIcon(sport: string): string {
    const icons: Record<string, string> = {
      football: 'sports_soccer',
      basketball: 'sports_basketball',
      volleyball: 'sports_volleyball',
      tennis: 'sports_tennis',
      multiple: 'stadium',
    };
    return icons[sport] ?? 'sports';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa',
      inactive: 'Inactiva',
      maintenance: 'Mantenimiento',
    };
    return labels[status] ?? status;
  }

  get firstImage(): string | null {
    const imgs = this.field().images;
    return imgs?.length ? imgs[0] : null;
  }
}
