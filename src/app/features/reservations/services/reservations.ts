import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { Reservation, CreateReservationDto, ReservationFilters } from '../../../core/models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reservations`;

  private buildParams(filters?: ReservationFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) return params;
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.fieldId)  params = params.set('fieldId', filters.fieldId);
    if (filters.userId)   params = params.set('userId', filters.userId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo)   params = params.set('dateTo', filters.dateTo);
    if (filters.page)     params = params.set('page', filters.page.toString());
    if (filters.limit)    params = params.set('limit', filters.limit.toString());
    return params;
  }

  getAll(filters?: ReservationFilters) {
    return this.http.get<PaginatedResponse<Reservation>>(this.base, { params: this.buildParams(filters) });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Reservation>>(`${this.base}/${id}`);
  }

  create(dto: CreateReservationDto) {
    return this.http.post<ApiResponse<Reservation>>(this.base, dto);
  }

  cancel(id: string) {
    return this.http.patch<ApiResponse<Reservation>>(`${this.base}/${id}/cancel`, {});
  }

  complete(id: string) {
    return this.http.patch<ApiResponse<Reservation>>(`${this.base}/${id}/complete`, {});
  }
}
