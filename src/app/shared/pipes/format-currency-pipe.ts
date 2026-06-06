import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatCurrency', standalone: true })
export class FormatCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'COP', showSymbol = true): string {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
