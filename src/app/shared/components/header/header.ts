import { Component, inject, input, output, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatMenuModule, MatBadgeModule, MatDividerModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = input<string>('');
  notificationCount = input<number>(0);
  sidebarToggle = output<void>();

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly userFullName = computed(() => this.authService.userFullName());
  readonly isAdmin = computed(() => this.authService.isAdmin());

  onToggleSidebar(): void {
    this.sidebarToggle.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
