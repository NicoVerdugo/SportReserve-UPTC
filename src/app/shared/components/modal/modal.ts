import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss',
})
export class Modal {
  dialogRef = inject(MatDialogRef<Modal>);
  data: ModalData = inject(MAT_DIALOG_DATA);

  get typeIcon(): string {
    switch (this.data.type) {
      case 'danger':  return 'dangerous';
      case 'warning': return 'warning';
      case 'info':    return 'info';
      default:        return 'help_outline';
    }
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
