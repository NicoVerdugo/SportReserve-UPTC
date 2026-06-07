import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationsService } from '../../services/notifications';
import { NotificationItem } from '../../components/notification-item/notification-item';
import { Notification } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    NotificationItem,
  ],
  templateUrl: './notifications-list.html',
  styleUrl: './notifications-list.scss',
})
export class NotificationsList implements OnInit {
  private notificationsService = inject(NotificationsService);

  notifications = signal<Notification[]>([]);
  loading = signal(true);

  unreadCount = computed(() => this.notifications().filter((n) => !n.isRead).length);

  groupedNotifications = computed(() => {
    const groups: { date: string; items: Notification[] }[] = [];
    const map = new Map<string, Notification[]>();

    for (const n of this.notifications()) {
      const date = new Date(n.createdAt).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const capitalised = date.charAt(0).toUpperCase() + date.slice(1);
      if (!map.has(capitalised)) map.set(capitalised, []);
      map.get(capitalised)!.push(n);
    }

    map.forEach((items, date) => groups.push({ date, items }));
    return groups;
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.notificationsService.getNotifications().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? [];
        this.notifications.set(Array.isArray(data) ? data : []);
        this.notificationsService.unreadCount.set(
          this.notifications().filter((n) => !n.isRead).length
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onMarkRead(id: string): void {
    this.notificationsService.markRead(id).subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        this.notificationsService.unreadCount.set(this.unreadCount());
      },
    });
  }

  onMarkAllRead(): void {
    this.notificationsService.markAllRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.notificationsService.unreadCount.set(0);
      },
    });
  }
}
