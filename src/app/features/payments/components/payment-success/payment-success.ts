import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.scss',
})
export class PaymentSuccess {
  confirmationNumber = input<string>('');
  viewReservations = output<void>();

  onViewReservations(): void {
    this.viewReservations.emit();
  }
}
