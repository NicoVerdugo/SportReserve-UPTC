import { Routes } from '@angular/router';

export const PaymentsRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/payment-history/payment-history').then(m => m.PaymentHistory),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/payment-page/payment-page').then(m => m.PaymentPage),
  },
];
