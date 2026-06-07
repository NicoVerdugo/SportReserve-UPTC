import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  getProfile() {
    return this.http.get(`${environment.apiUrl}/auth/me`);
  }

  updateProfile(dto: any) {
    return this.http.put(`${environment.apiUrl}/auth/me`, dto);
  }

  changePassword(dto: any) {
    return this.http.put(`${environment.apiUrl}/auth/change-password`, dto);
  }
}
