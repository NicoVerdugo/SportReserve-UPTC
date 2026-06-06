import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './features-section.html',
  styleUrl: './features-section.scss',
})
export class FeaturesSection {
  features: Feature[] = [
    {
      icon: 'schedule',
      title: 'Disponibilidad en Tiempo Real',
      description:
        'Consulta la disponibilidad de canchas al instante y reserva sin llamadas ni esperas.',
      color: '#1976d2',
    },
    {
      icon: 'lock',
      title: 'Pago Seguro',
      description:
        'Transacciones protegidas con los más altos estándares de seguridad. Múltiples métodos de pago.',
      color: '#388e3c',
    },
    {
      icon: 'history',
      title: 'Historial Completo',
      description:
        'Accede a todo tu historial de reservas y pagos en cualquier momento desde tu perfil.',
      color: '#f57c00',
    },
  ];
}
