import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatPhone', standalone: true })
export class FormatPhonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '-';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return value;
  }
}
