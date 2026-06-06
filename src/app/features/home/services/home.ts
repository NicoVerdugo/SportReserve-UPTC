import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);

  getFeaturedFields() {
    return this.http.get(`${environment.apiUrl}/fields?status=active&limit=6`);
  }
}
