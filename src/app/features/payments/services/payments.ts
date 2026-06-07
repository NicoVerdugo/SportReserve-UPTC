import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);

  getMyPayments() {
    return this.http.get(`${environment.apiUrl}/payments/my`);
  }

  getPaymentById(id: string) {
    return this.http.get(`${environment.apiUrl}/payments/${id}`);
  }

  createPayment(dto: any) {
    return this.http.post(`${environment.apiUrl}/payments`, dto);
  }
}
