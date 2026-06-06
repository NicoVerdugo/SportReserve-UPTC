import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardStats as AdminStats, UserDashboardStats } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard-stats.html',
  styleUrl: './dashboard-stats.scss',
})
export class DashboardStatsComponent {
  stats = input<AdminStats | UserDashboardStats | null>(null);
  isAdmin = input<boolean>(false);
}
