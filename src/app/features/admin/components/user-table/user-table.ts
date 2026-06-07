import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss',
})
export class UserTable {
  users = input<User[]>([]);

  editUser = output<User>();
  deleteUser = output<User>();
  toggleStatus = output<User>();

  displayedColumns = ['avatar', 'nombre', 'email', 'rol', 'estado', 'creado', 'acciones'];

  getInitials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
