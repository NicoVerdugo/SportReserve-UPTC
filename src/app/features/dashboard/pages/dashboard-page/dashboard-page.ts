import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth';
import { DashboardService } from '../../services/dashboard';
import { DashboardStats, UserDashboardStats } from '../../../../core/models/api-response.model';
import { Reservation } from '../../../../core/models/reservation.model';
import { DashboardStatsComponent } from '../../components/dashboard-stats/dashboard-stats';
import { DashboardCharts } from '../../components/dashboard-charts/dashboard-charts';
import { RecentActivity } from '../../components/recent-activity/recent-activity';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DashboardStatsComponent,
    DashboardCharts,
    RecentActivity,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  adminStats = signal<DashboardStats | null>(null);
  userStats = signal<UserDashboardStats | null>(null);
  loading = signal(false);

  isAdmin = computed(() => this.authService.isAdmin());

  ngOnInit(): void {
    if (this.isAdmin()) {
      this.loadAdminStats();
    } else {
      this.loadUserStats();
    }
  }

  private loadAdminStats(): void {
    this.loading.set(true);
    this.dashboardService.getAdminStats().subscribe({
      next: (res) => {
        this.adminStats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadUserStats(): void {
    this.loading.set(true);
    this.dashboardService.getUserStats().subscribe({
      next: (res) => {
        this.userStats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get upcomingReservations(): Reservation[] {
    return this.userStats()?.upcomingReservations ?? [];
  }

  get recentReservations(): Reservation[] {
    return this.adminStats()?.recentReservations ?? [];
  }

  navigateToNewReservation(): void {
    this.router.navigate(['/fields']);
  }

  navigateToFields(): void {
    this.router.navigate(['/fields']);
  }
}
