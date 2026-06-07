import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-field-gallery',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './field-gallery.html',
  styleUrl: './field-gallery.scss',
})
export class FieldGallery {
  images = input<string[]>([]);
  activeIndex = signal(0);

  selectImage(i: number): void { this.activeIndex.set(i); }

  get activeImage(): string | null {
    const imgs = this.images();
    return imgs.length ? imgs[this.activeIndex()] : null;
  }
}
