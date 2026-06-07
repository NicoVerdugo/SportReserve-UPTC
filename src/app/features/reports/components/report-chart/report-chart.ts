import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-chart.html',
  styleUrl: './report-chart.scss',
})
export class ReportChart {
  data  = input<ChartDataPoint[]>([]);
  type  = input<'bar' | 'line' | 'pie'>('bar');
  title = input<string>('');

  maxValue = computed(() => {
    const vals = this.data().map((d) => d.value);
    return vals.length ? Math.max(...vals) : 1;
  });

  barHeightPercent(value: number): number {
    const max = this.maxValue();
    return max === 0 ? 0 : Math.round((value / max) * 100);
  }

  pieSegments = computed(() => {
    const total = this.data().reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];

    const colors = ['#1976d2', '#43a047', '#f57c00', '#8e24aa', '#e53935', '#00acc1'];
    let offset = 0;
    return this.data().map((d, i) => {
      const pct = (d.value / total) * 100;
      const seg = { ...d, pct, offset, color: colors[i % colors.length] };
      offset += pct;
      return seg;
    });
  });

  formatValue(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  }
}
