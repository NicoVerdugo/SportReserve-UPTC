import { Routes } from '@angular/router';

export const AdminRoutingModule: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/users-management/users-management').then(m => m.UsersManagement),
  },
  {
    path: 'fields',
    loadComponent: () =>
      import('./pages/fields-management/fields-management').then(m => m.FieldsManagement),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings').then(m => m.Settings),
  },
];
