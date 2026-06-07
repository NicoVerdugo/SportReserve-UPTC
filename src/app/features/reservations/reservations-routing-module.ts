import { Routes } from '@angular/router';

export const ReservationsRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reservations-list/reservations-list').then(m => m.ReservationsList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/create-reservation/create-reservation').then(m => m.CreateReservation),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/reservation-detail/reservation-detail').then(m => m.ReservationDetail),
  },
];
