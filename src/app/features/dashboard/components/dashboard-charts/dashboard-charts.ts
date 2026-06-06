import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { DashboardStats } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-dashboard-charts',
  imports: [CommonModule, MatCardModule],
  templateUrl: './dashboard-charts.html',
  styleUrl: './dashboard-charts.scss',
})
export class DashboardCharts {
  stats = input<DashboardStats | null>(null);

  maxRevenue = computed(() => {
    const s = this.stats();
    if (!s?.revenueByMonth?.length) return 1;
    return Math.max(...s.revenueByMonth.map(r => r.revenue));
  });

  maxReservations = computed(() => {
    const s = this.stats();
    if (!s?.reservationsByField?.length) return 1;
    return Math.max(...s.reservationsByField.map(r => r.count));
  });

  getBarHeight(value: number): string {
    return `${Math.max(4, (value / this.maxRevenue()) * 200)}px`;
  }

  getBarWidth(value: number): string {
    return `${Math.max(4, (value / this.maxReservations()) * 100)}%`;
  }
}
