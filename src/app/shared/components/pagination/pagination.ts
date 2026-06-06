import { Component, input, output, OnChanges, SimpleChanges } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatPaginatorModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination implements OnChanges {
  currentPage = input<number>(1);
  totalPages = input<number>(1);
  totalItems = input<number>(0);
  pageSize = input<number>(10);

  pageChange = output<number>();

  /** Zero-based index used by mat-paginator */
  pageIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage']) {
      this.pageIndex = Math.max(0, this.currentPage() - 1);
    }
  }

  onPageEvent(event: PageEvent): void {
    // mat-paginator is zero-based; emit 1-based page number
    this.pageChange.emit(event.pageIndex + 1);
  }
}
