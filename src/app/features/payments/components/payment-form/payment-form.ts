import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentForm {
  cardForm = {
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  };

  formatCardNumber(value: string): string {
    return value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  }

  formatExpiry(value: string): string {
    const clean = value.replace(/\D/g, '');
    if (clean.length >= 2) return clean.slice(0, 2) + '/' + clean.slice(2, 4);
    return clean;
  }
}
