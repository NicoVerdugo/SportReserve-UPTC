import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, DashboardStats, UserDashboardStats } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getAdminStats() {
    return this.http.get<ApiResponse<DashboardStats>>(`${environment.apiUrl}/dashboard/admin`);
  }

  getUserStats() {
    return this.http.get<ApiResponse<UserDashboardStats>>(`${environment.apiUrl}/dashboard/user`);
  }
}
