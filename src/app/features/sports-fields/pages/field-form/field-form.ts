import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SportsFieldsService } from '../../services/sports-fields';
import { NotificationService } from '../../../../core/services/notification';
import { SportField, SportType, FieldStatus } from '../../../../core/models/sport-field.model';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
  selector: 'app-field-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './field-form.html',
  styleUrl: './field-form.scss',
})
export class FieldForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private fieldsService = inject(SportsFieldsService);
  private notification = inject(NotificationService);

  loading = signal(false);
  submitting = signal(false);
  fieldId = signal<string | null>(null);
  imagePreview = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  isEditMode = computed(() => !!this.fieldId());

  sportTypes: { value: SportType; label: string }[] = [
    { value: 'football', label: 'Fútbol' },
    { value: 'basketball', label: 'Baloncesto' },
    { value: 'volleyball', label: 'Voleibol' },
    { value: 'tennis', label: 'Tenis' },
    { value: 'multiple', label: 'Múltiple' },
  ];

  statusOptions: { value: FieldStatus; label: string }[] = [
    { value: 'active', label: 'Activa' },
    { value: 'inactive', label: 'Inactiva' },
    { value: 'maintenance', label: 'Mantenimiento' },
  ];

  dayNames = DAY_NAMES;

  form: FormGroup = this.fb.group({
    name:         ['', [Validators.required, Validators.minLength(3)]],
    sportType:    ['football', Validators.required],
    location:     ['', Validators.required],
    description:  [''],
    capacity:     [10, [Validators.required, Validators.min(1)]],
    pricePerHour: [50000, [Validators.required, Validators.min(0)]],
    status:       ['active', Validators.required],
    schedule:     this.fb.array([]),
  });

  get schedule(): FormArray { return this.form.get('schedule') as FormArray; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fieldId.set(id);
      this.loadField(id);
    } else {
      this.addDefaultSchedule();
    }
  }

  private loadField(id: string): void {
    this.loading.set(true);
    this.fieldsService.getById(id).subscribe({
      next: (res) => {
        const f: SportField = res.data;
        this.form.patchValue({
          name: f.name, sportType: f.sportType, location: f.location,
          description: f.description, capacity: f.capacity,
          pricePerHour: f.pricePerHour, status: f.status,
        });
        f.schedule.forEach(s => this.addScheduleRow(s.dayOfWeek, s.openTime, s.closeTime));
        this.loading.set(false);
      },
      error: () => { this.notification.error('Error al cargar la cancha'); this.loading.set(false); },
    });
  }

  private addDefaultSchedule(): void {
    [1, 2, 3, 4, 5].forEach(d => this.addScheduleRow(d, '08:00', '22:00'));
  }

  addScheduleRow(day = 1, open = '08:00', close = '22:00'): void {
    this.schedule.push(this.fb.group({
      dayOfWeek: [day, Validators.required],
      openTime:  [open, Validators.required],
      closeTime: [close, Validators.required],
    }));
  }

  removeScheduleRow(i: number): void { this.schedule.removeAt(i); }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notification.error('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.notification.error('La imagen no puede pesar más de 5MB');
      return;
    }

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagePreview.set(null);
    this.selectedFile.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const id = this.fieldId();
    const dto = this.form.value;

    // Add image if one was selected
    const preview = this.imagePreview();
    if (preview) {
      dto.images = [preview];
    }

    const obs = id
      ? this.fieldsService.update(id, dto)
      : this.fieldsService.create(dto);

    obs.subscribe({
      next: () => {
        this.notification.success(id ? 'Cancha actualizada' : 'Cancha creada');
        this.router.navigate(['/fields']);
      },
      error: () => {
        this.notification.error('Error al guardar la cancha');
        this.submitting.set(false);
      },
    });
  }

  cancel(): void { this.router.navigate(['/fields']); }
}
