import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout').then(m => m.PublicLayout),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/home/home-routing-module').then(m => m.HomeRoutingModule),
      },
      {
        path: 'fields',
        loadChildren: () => import('./features/sports-fields/sports-fields-routing-module').then(m => m.SportsFieldsRoutingModule),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayout),
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/auth/auth-routing-module').then(m => m.AuthRoutingModule),
      },
    ],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/dashboard/dashboard-routing-module').then(m => m.DashboardRoutingModule),
      },
      {
        path: 'reservations',
        loadChildren: () => import('./features/reservations/reservations-routing-module').then(m => m.ReservationsRoutingModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile-routing-module').then(m => m.ProfileRoutingModule),
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments-routing-module').then(m => m.PaymentsRoutingModule),
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications-routing-module').then(m => m.NotificationsRoutingModule),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin-routing-module').then(m => m.AdminRoutingModule),
      },
      {
        path: 'reports',
        canActivate: [adminGuard],
        loadChildren: () => import('./features/reports/reports-routing-module').then(m => m.ReportsRoutingModule),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
