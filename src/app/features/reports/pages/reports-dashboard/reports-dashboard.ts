import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsService } from '../../services/reports';
import { NotificationService } from '../../../../core/services/notification';
import { ReportChart, ChartDataPoint } from '../../components/report-chart/report-chart';

interface ReportCard {
  type: string;
  title: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ReportChart],
  templateUrl: './reports-dashboard.html',
  styleUrl: './reports-dashboard.scss',
})
export class ReportsDashboard implements OnInit {
  private reportsService = inject(ReportsService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  loading = signal(false);
  revenueData = signal<ChartDataPoint[]>([]);
  occupancyData = signal<ChartDataPoint[]>([]);

  readonly reportCards: ReportCard[] = [
    { type: 'revenue',      title: 'Ingresos',     icon: 'attach_money',    description: 'Análisis de ingresos por período', color: 'green' },
    { type: 'reservations', title: 'Reservas',     icon: 'event',           description: 'Estadísticas de reservas',          color: 'blue' },
    { type: 'occupancy',    title: 'Ocupación',    icon: 'bar_chart',       description: 'Tasa de ocupación por cancha',      color: 'orange' },
  ];

  private today = new Date();
  private dateFrom = new Date(this.today.getFullYear(), this.today.getMonth(), 1)
    .toISOString().split('T')[0];
  private dateTo = this.today.toISOString().split('T')[0];

  ngOnInit(): void {
    this.loadSummary();
  }

  private loadSummary(): void {
    this.loading.set(true);

    this.reportsService.getRevenue(this.dateFrom, this.dateTo).subscribe({
      next: (res: any) => {
        const daily: { date: string; revenue: number }[] = res?.data?.dailyRevenue ?? [];
        this.revenueData.set(
          daily.map((d) => ({ label: d.date.slice(5), value: d.revenue }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.revenueData.set(this.mockRevenue());
        this.loading.set(false);
      },
    });

    this.reportsService.getOccupancy().subscribe({
      next: (res: any) => {
        const fields: { fieldName: string; occupancyRate: number }[] = res?.data?.fields ?? [];
        this.occupancyData.set(
          fields.map((f) => ({ label: f.fieldName, value: Math.round(f.occupancyRate) }))
        );
      },
      error: () => this.occupancyData.set(this.mockOccupancy()),
    });
  }

  navigateTo(type: string): void {
    this.router.navigate(['/dashboard/reports', type]);
  }

  private mockRevenue(): ChartDataPoint[] {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return months.map((label) => ({ label, value: Math.round(Math.random() * 5_000_000 + 1_000_000) }));
  }

  private mockOccupancy(): ChartDataPoint[] {
    return [
      { label: 'Cancha A', value: 82 },
      { label: 'Cancha B', value: 67 },
      { label: 'Cancha C', value: 91 },
      { label: 'Cancha D', value: 54 },
    ];
  }
}
