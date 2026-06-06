import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({ selector: '[appHighlight]', standalone: true })
export class Highlight {
  private el = inject(ElementRef);
  appHighlight = input<string>('#fff3e0');

  @HostListener('mouseenter')
  onEnter(): void {
    this.el.nativeElement.style.backgroundColor = this.appHighlight();
    this.el.nativeElement.style.transition = 'background-color 0.2s';
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.el.nativeElement.style.backgroundColor = '';
  }
}
