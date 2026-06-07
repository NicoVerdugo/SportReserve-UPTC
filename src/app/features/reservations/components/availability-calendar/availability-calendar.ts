import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TimeSlot } from '../../../../core/models/sport-field.model';

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './availability-calendar.html',
  styleUrl: './availability-calendar.scss',
})
export class AvailabilityCalendar {
  slots = input<TimeSlot[]>([]);
  selectedDate = input<Date | null>(null);
  loading = input<boolean>(false);

  dateChange = output<Date>();
  slotSelect = output<TimeSlot>();

  minDate = new Date();

  get availableSlots(): TimeSlot[] {
    return this.slots().filter(s => s.available);
  }

  onDateChange(date: Date | null): void {
    if (date) this.dateChange.emit(date);
  }

  onSlotClick(slot: TimeSlot): void {
    this.slotSelect.emit(slot);
  }
}
