import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { SportField } from '../../../../core/models/sport-field.model';

@Component({
  selector: 'app-field-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  templateUrl: './field-settings.html',
  styleUrl: './field-settings.scss',
})
export class FieldSettings {
  field = input<SportField | null>(null);
  saved = output<Partial<SportField>>();

  onSave(data: Partial<SportField>): void {
    this.saved.emit(data);
  }
}
