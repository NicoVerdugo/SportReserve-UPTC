import { Component, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.scss',
})
export class HeroSection {
  ctaClick = output<string>();

  onViewFields(): void {
    this.ctaClick.emit('fields');
  }

  onRegister(): void {
    this.ctaClick.emit('register');
  }
}
