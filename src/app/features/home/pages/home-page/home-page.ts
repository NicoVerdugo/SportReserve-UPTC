import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HomeService } from '../../services/home';
import { HeroSection } from '../../components/hero-section/hero-section';
import { FeaturesSection } from '../../components/features-section/features-section';
import { SportField } from '../../../../core/models/sport-field.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    HeroSection,
    FeaturesSection,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private homeService = inject(HomeService);
  private router = inject(Router);

  featuredFields = signal<SportField[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.homeService.getFeaturedFields().subscribe({
      next: (res: any) => {
        const fields = res?.data ?? res ?? [];
        this.featuredFields.set(Array.isArray(fields) ? fields : []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onViewFields(): void {
    this.router.navigate(['/fields']);
  }

  onReserve(fieldId: string): void {
    this.router.navigate(['/dashboard/reservations/new'], {
      queryParams: { fieldId },
    });
  }

  onRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  handleHeroCta(action: string): void {
    if (action === 'fields') {
      this.onViewFields();
    } else {
      this.onRegister();
    }
  }

  getSportLabel(sport: string): string {
    const labels: Record<string, string> = {
      football: 'Fútbol',
      basketball: 'Baloncesto',
      volleyball: 'Voleibol',
      tennis: 'Tenis',
      multiple: 'Múltiple',
    };
    return labels[sport] ?? sport;
  }
}
