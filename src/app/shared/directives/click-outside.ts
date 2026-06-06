import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutside {
  private el = inject(ElementRef);
  clickOutside = output<void>();

  @HostListener('document:click', ['$event'])
  onClick(event: Event): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.clickOutside.emit();
    }
  }
}
