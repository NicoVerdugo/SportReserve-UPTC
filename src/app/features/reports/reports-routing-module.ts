import { Routes } from '@angular/router';

export const ReportsRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports-dashboard/reports-dashboard').then(m => m.ReportsDashboard),
  },
  {
    path: ':type',
    loadComponent: () =>
      import('./pages/report-detail/report-detail').then(m => m.ReportDetail),
  },
];
