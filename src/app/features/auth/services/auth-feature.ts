import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthFeatureService {
  private http = inject(HttpClient);

  checkEmail(email: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.http.get<ApiResponse<{ available: boolean }>>(
      `${environment.apiUrl}/auth/check-email?email=${encodeURIComponent(email)}`
    );
  }
}
