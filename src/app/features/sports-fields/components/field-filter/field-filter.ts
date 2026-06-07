import { Component, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

export interface FieldFilterValues {
  sportType?: string;
  search?: string;
}

@Component({
  selector: 'app-field-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './field-filter.html',
  styleUrl: './field-filter.scss',
})
export class FieldFilter implements OnInit, OnDestroy {
  filterChange = output<FieldFilterValues>();

  form: FormGroup;
  private destroy$ = new Subject<void>();

  sportTypes = [
    { value: '', label: 'Todos los deportes' },
    { value: 'football', label: 'Fútbol' },
    { value: 'basketball', label: 'Baloncesto' },
    { value: 'volleyball', label: 'Voleibol' },
    { value: 'tennis', label: 'Tenis' },
    { value: 'multiple', label: 'Múltiple' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      search: [''],
      sportType: [''],
    });
  }

  ngOnInit(): void {
    this.form.get('search')!.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.emit());

    this.form.get('sportType')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.emit());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emit(): void {
    const { search, sportType } = this.form.value;
    this.filterChange.emit({
      search: search || undefined,
      sportType: sportType || undefined,
    });
  }
}
