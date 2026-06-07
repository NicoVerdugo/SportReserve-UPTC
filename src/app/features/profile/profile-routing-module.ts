import { Routes } from '@angular/router';

export const ProfileRoutingModule: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-page/profile-page').then(m => m.ProfilePage),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./pages/edit-profile/edit-profile').then(m => m.EditProfile),
  },
];
