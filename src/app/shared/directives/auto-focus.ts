import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({ selector: '[appAutoFocus]', standalone: true })
export class AutoFocus implements OnInit {
  private el = inject(ElementRef);

  ngOnInit(): void {
    setTimeout(() => this.el.nativeElement.focus(), 0);
  }
}
