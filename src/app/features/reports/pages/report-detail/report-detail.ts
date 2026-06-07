import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ReportsService } from '../../services/reports';
import { NotificationService } from '../../../../core/services/notification';
import { ReportChart, ChartDataPoint } from '../../components/report-chart/report-chart';
import { ReportFilter, ReportFilters } from '../../components/report-filter/report-filter';

const REPORT_META: Record<string, { title: string; icon: string; chartType: 'bar' | 'line' | 'pie' }> = {
  revenue:      { title: 'Reporte de Ingresos',    icon: 'attach_money', chartType: 'bar'  },
  reservations: { title: 'Reporte de Reservas',    icon: 'event',        chartType: 'line' },
  occupancy:    { title: 'Reporte de Ocupación',   icon: 'bar_chart',    chartType: 'pie'  },
};

@Component({
  selector: 'app-report-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTableModule, ReportChart, ReportFilter],
  templateUrl: './report-detail.html',
  styleUrl: './report-detail.scss',
})
export class ReportDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportsService = inject(ReportsService);
  private notification = inject(NotificationService);

  reportType = signal('revenue');
  loading = signal(false);
  chartData = signal<ChartDataPoint[]>([]);
  tableRows = signal<{ label: string; value: string | number }[]>([]);

  meta = computed(() => REPORT_META[this.reportType()] ?? REPORT_META['revenue']);

  private today = new Date();
  private filters: ReportFilters = {
    dateFrom: new Date(this.today.getFullYear(), this.today.getMonth(), 1).toISOString().split('T')[0],
    dateTo: this.today.toISOString().split('T')[0],
  };

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type') ?? 'revenue';
    this.reportType.set(type);
    this.loadReport();
  }

  onFilterChange(filters: ReportFilters): void {
    this.filters = filters;
    this.loadReport();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/reports']);
  }

  private loadReport(): void {
    this.loading.set(true);
    const type = this.reportType();

    if (type === 'revenue') {
      this.reportsService.getRevenue(this.filters.dateFrom, this.filters.dateTo).subscribe({
        next: (res: any) => this.handleRevenue(res?.data),
        error: () => { this.useMockData(); this.loading.set(false); },
      });
    } else if (type === 'reservations') {
      this.reportsService.getReservations(this.filters).subscribe({
        next: (res: any) => this.handleReservations(res?.data),
        error: () => { this.useMockData(); this.loading.set(false); },
      });
    } else {
      this.reportsService.getOccupancy().subscribe({
        next: (res: any) => this.handleOccupancy(res?.data),
        error: () => { this.useMockData(); this.loading.set(false); },
      });
    }
  }

  private handleRevenue(data: any): void {
    const daily: { date: string; revenue: number }[] = data?.dailyRevenue ?? [];
    this.chartData.set(daily.map((d) => ({ label: d.date.slice(5), value: d.revenue })));
    const total = data?.summary?.totalRevenue ?? 0;
    const avg = daily.length ? Math.round(total / daily.length) : 0;
    this.tableRows.set([
      { label: 'Total ingresos',    value: `$${total.toLocaleString('es-CO')} COP` },
      { label: 'Transacciones',     value: data?.summary?.totalTransactions ?? 0 },
      { label: 'Promedio por día',  value: `$${avg.toLocaleString('es-CO')} COP` },
    ]);
    this.loading.set(false);
  }

  private handleReservations(data: any): void {
    const byDay: { date: string; count: number }[] = data?.byDay ?? [];
    this.chartData.set(byDay.map((d) => ({ label: d.date.slice(5), value: d.count })));
    const s = data?.summary ?? {};
    this.tableRows.set([
      { label: 'Total reservas', value: s.totalCount ?? 0 },
      { label: 'Ingresos',       value: `$${(s.totalRevenue ?? 0).toLocaleString('es-CO')} COP` },
      { label: 'Horas totales',  value: s.totalHours ?? 0 },
      { label: 'Precio promedio',value: `$${Math.round(s.avgPrice ?? 0).toLocaleString('es-CO')} COP` },
    ]);
    this.loading.set(false);
  }

  private handleOccupancy(data: any): void {
    const fields: { fieldName: string; occupancyRate: number }[] = data?.fields ?? [];
    this.chartData.set(fields.map((f) => ({ label: f.fieldName, value: Math.round(f.occupancyRate ?? 0) })));
    this.tableRows.set([
      { label: 'Promedio ocupación', value: `${data?.averageOccupancyRate ?? 0}%` },
      ...fields.map((f) => ({ label: f.fieldName, value: `${Math.round(f.occupancyRate ?? 0)}%` })),
    ]);
    this.loading.set(false);
  }

  private useMockData(): void {
    const type = this.reportType();
    if (type === 'revenue') {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
      this.chartData.set(months.map((label) => ({ label, value: Math.round(Math.random() * 5_000_000 + 500_000) })));
      this.tableRows.set([{ label: 'Datos de ejemplo', value: 'Sin conexión al servidor' }]);
    } else if (type === 'reservations') {
      this.chartData.set([{ label: 'Pendientes', value: 12 }, { label: 'Confirmadas', value: 45 }, { label: 'Canceladas', value: 8 }, { label: 'Completadas', value: 67 }]);
      this.tableRows.set([{ label: 'Total', value: 132 }]);
    } else {
      this.chartData.set([{ label: 'Cancha A', value: 82 }, { label: 'Cancha B', value: 67 }, { label: 'Cancha C', value: 91 }]);
      this.tableRows.set([{ label: 'Promedio', value: '80%' }]);
    }
    this.notification.warning('Mostrando datos de ejemplo — servidor no disponible');
  }
}
