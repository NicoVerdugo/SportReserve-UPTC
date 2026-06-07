import { Routes } from '@angular/router';

export const NotificationsRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notifications-list/notifications-list').then(m => m.NotificationsList),
  },
];
