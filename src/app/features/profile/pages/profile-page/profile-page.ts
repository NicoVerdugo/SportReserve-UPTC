import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase();
  });

  fullName = this.authService.userFullName;

  roleLabel = computed(() => {
    const role = this.user()?.role;
    return role === 'ADMIN' ? 'Administrador' : 'Usuario';
  });

  statusLabel = computed(() => {
    const status = this.user()?.status;
    const map: Record<string, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      blocked: 'Bloqueado',
    };
    return status ? (map[status] ?? status) : '';
  });

  memberSince = computed(() => {
    const date = this.user()?.createdAt;
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  onEditProfile(): void {
    this.router.navigate(['/dashboard/profile/edit']);
  }

  onChangePassword(): void {
    this.router.navigate(['/dashboard/profile/edit'], {
      queryParams: { tab: 'password' },
    });
  }
}
