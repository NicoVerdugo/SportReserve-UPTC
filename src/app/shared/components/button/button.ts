import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

export type ButtonColor = 'primary' | 'accent' | 'warn';
export type ButtonVariant = 'raised' | 'stroked' | 'flat';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  label = input<string>('');
  color = input<ButtonColor>('primary');
  variant = input<ButtonVariant>('raised');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  icon = input<string>('');

  clicked = output<void>();

  onClick(): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
