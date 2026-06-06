import { Component, inject, input, output, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

interface NavItem {
  route: string;
  icon: string;
  label: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink, RouterLinkActive,
    MatListModule, MatIconModule, MatButtonModule, MatDividerModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private authService = inject(AuthService);

  isOpen = input<boolean>(false);
  closeSidebar = output<void>();

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly userFullName = computed(() => this.authService.userFullName());

  readonly navItems: NavItem[] = [
    { route: '/dashboard', icon: 'dashboard', label: 'Dashboard', adminOnly: false },
    { route: '/dashboard/reservations', icon: 'event', label: 'Mis reservas', adminOnly: false },
    { route: '/dashboard/payments', icon: 'payment', label: 'Pagos', adminOnly: false },
    { route: '/dashboard/notifications', icon: 'notifications', label: 'Notificaciones', adminOnly: false },
    { route: '/dashboard/profile', icon: 'person', label: 'Mi perfil', adminOnly: false },
  ];

  readonly adminNavItems: NavItem[] = [
    { route: '/dashboard/admin/users', icon: 'group', label: 'Usuarios', adminOnly: true },
    { route: '/dashboard/admin/fields', icon: 'sports_soccer', label: 'Canchas', adminOnly: true },
    { route: '/dashboard/reports', icon: 'bar_chart', label: 'Reportes', adminOnly: true },
    { route: '/dashboard/admin/settings', icon: 'settings', label: 'Configuración', adminOnly: true },
  ];

  onClose(): void {
    this.closeSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
