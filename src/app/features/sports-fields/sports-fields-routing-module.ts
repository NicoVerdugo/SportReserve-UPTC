import { Routes } from '@angular/router';

export const SportsFieldsRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/fields-list/fields-list').then(m => m.FieldsList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/field-form/field-form').then(m => m.FieldForm),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/field-detail/field-detail').then(m => m.FieldDetail),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/field-form/field-form').then(m => m.FieldForm),
  },
];
