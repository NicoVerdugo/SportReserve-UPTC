import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import { SportField, CreateFieldDto, TimeSlot } from '../../../core/models/sport-field.model';

export interface FieldFilters {
  sportType?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SportsFieldsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fields`;

  getAll(filters?: FieldFilters) {
    let params = new HttpParams();
    if (filters) {
      if (filters.sportType) params = params.set('sportType', filters.sportType);
      if (filters.status)    params = params.set('status', filters.status);
      if (filters.search)    params = params.set('search', filters.search);
      if (filters.page)      params = params.set('page', filters.page.toString());
      if (filters.limit)     params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<PaginatedResponse<SportField>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<SportField>>(`${this.base}/${id}`);
  }

  create(dto: CreateFieldDto) {
    return this.http.post<ApiResponse<SportField>>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateFieldDto>) {
    return this.http.put<ApiResponse<SportField>>(`${this.base}/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  getAvailability(id: string, date: string) {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<TimeSlot[]>>(`${this.base}/${id}/availability`, { params });
  }
}
