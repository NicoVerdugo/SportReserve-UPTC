import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatDate', standalone: true })
export class FormatDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {};

    switch (format) {
      case 'short':
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      case 'long':
        return date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      case 'time':
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return date.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      default:
        return date.toLocaleDateString('es-CO');
    }
  }
}
