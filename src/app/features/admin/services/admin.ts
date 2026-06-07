import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PaginatedResponse, ApiResponse } from '../../../core/models/api-response.model';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers(params: any = {}) {
    return this.http.get<PaginatedResponse<User>>(`${environment.apiUrl}/users`, { params });
  }

  updateUser(id: string, dto: any) {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/users/${id}`, dto);
  }

  deleteUser(id: string) {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/users/${id}`);
  }

  updateUserStatus(id: string, status: string) {
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/${id}/status`, { status });
  }

  updateUserRole(id: string, role: string) {
    return this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/${id}/role`, { role });
  }
}
