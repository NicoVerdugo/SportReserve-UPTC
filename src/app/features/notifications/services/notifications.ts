import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  unreadCount = signal(0);

  getNotifications() {
    return this.http.get(`${environment.apiUrl}/notifications`);
  }

  markRead(id: string) {
    return this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {});
  }

  markAllRead() {
    return this.http.patch(`${environment.apiUrl}/notifications/read-all`, {});
  }
}
