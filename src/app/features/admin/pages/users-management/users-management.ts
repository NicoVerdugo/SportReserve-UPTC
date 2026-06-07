import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../../services/admin';
import { NotificationService } from '../../../../core/services/notification';
import { UserTable } from '../../components/user-table/user-table';
import { UserForm } from '../../components/user-form/user-form';
import { User } from '../../../../core/models/user.model';
import { Pagination } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    UserTable,
  ],
  templateUrl: './users-management.html',
  styleUrl: './users-management.scss',
})
export class UsersManagement implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);

  users = signal<User[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  pagination = signal<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 1, limit = 10): void {
    this.loading.set(true);
    const params: any = { page, limit };
    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }
    this.adminService.getUsers(params).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.notification.error('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.loadUsers(1, this.pagination().limit);
  }

  onPageChange(event: PageEvent): void {
    this.loadUsers(event.pageIndex + 1, event.pageSize);
  }

  onEdit(user: User): void {
    const ref = this.dialog.open(UserForm, {
      data: { user },
      width: '560px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.adminService.updateUser(user._id, result).subscribe({
          next: () => {
            this.notification.success('Usuario actualizado');
            this.loadUsers(this.pagination().page, this.pagination().limit);
          },
          error: () => this.notification.error('Error al actualizar usuario'),
        });
      }
    });
  }

  onDelete(user: User): void {
    if (!confirm(`¿Eliminar al usuario ${user.firstName} ${user.lastName}? Esta acción no se puede deshacer.`)) return;
    this.adminService.deleteUser(user._id).subscribe({
      next: () => {
        this.notification.success('Usuario eliminado');
        this.loadUsers(this.pagination().page, this.pagination().limit);
      },
      error: () => this.notification.error('Error al eliminar usuario'),
    });
  }

  onToggleStatus(user: User): void {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const label = newStatus === 'blocked' ? 'bloqueado' : 'activado';
    this.adminService.updateUserStatus(user._id, newStatus).subscribe({
      next: () => {
        this.notification.success(`Usuario ${label} correctamente`);
        this.loadUsers(this.pagination().page, this.pagination().limit);
      },
      error: () => this.notification.error('Error al cambiar estado'),
    });
  }
}
