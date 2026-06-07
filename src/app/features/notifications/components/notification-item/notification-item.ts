import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Notification, NotificationType } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.scss',
})
export class NotificationItem {
  notification = input.required<Notification>();
  markRead = output<string>();

  isRead = computed(() => this.notification().isRead);

  icon = computed(() => {
    const map: Record<NotificationType, string> = {
      reservation: 'event',
      payment: 'payment',
      system: 'notifications',
      reminder: 'alarm',
    };
    return map[this.notification().type] ?? 'notifications';
  });

  iconColor = computed(() => {
    const map: Record<NotificationType, string> = {
      reservation: '#1976d2',
      payment: '#2e7d32',
      system: '#f57c00',
      reminder: '#7b1fa2',
    };
    return map[this.notification().type] ?? '#555';
  });

  timeAgo = computed(() => {
    const date = new Date(this.notification().createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMin < 1)  return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  });

  onMarkRead(): void {
    if (!this.isRead()) {
      this.markRead.emit(this.notification()._id);
    }
  }
}
