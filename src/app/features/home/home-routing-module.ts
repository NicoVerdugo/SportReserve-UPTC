import { Routes } from '@angular/router';

export const HomeRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home-page/home-page').then(m => m.HomePage),
  },
];
