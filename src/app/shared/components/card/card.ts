import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [MatCardModule, MatDividerModule],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  title = input<string>('');
  subtitle = input<string>('');
}
