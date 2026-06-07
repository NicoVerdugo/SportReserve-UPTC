import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-report-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './report-filter.html',
  styleUrl: './report-filter.scss',
})
export class ReportFilter {
  filterChange = output<ReportFilters>();

  private today = new Date();
  dateFrom = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1).toISOString().split('T')[0]);
  dateTo = signal(this.today.toISOString().split('T')[0]);

  onApply(): void {
    this.filterChange.emit({ dateFrom: this.dateFrom(), dateTo: this.dateTo() });
  }

  onReset(): void {
    this.dateFrom.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1).toISOString().split('T')[0]);
    this.dateTo.set(this.today.toISOString().split('T')[0]);
    this.onApply();
  }
}
