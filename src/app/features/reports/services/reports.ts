import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private http = inject(HttpClient);

  getRevenue(dateFrom: string, dateTo: string) {
    return this.http.get(`${environment.apiUrl}/reports/revenue`, {
      params: { dateFrom, dateTo },
    });
  }

  getReservations(filters: any) {
    return this.http.get(`${environment.apiUrl}/reports/reservations`, { params: filters });
  }

  getOccupancy() {
    return this.http.get(`${environment.apiUrl}/reports/occupancy`);
  }
}
