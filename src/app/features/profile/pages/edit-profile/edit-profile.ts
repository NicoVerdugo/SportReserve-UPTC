import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth';
import { NotificationService } from '../../../../core/services/notification';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
})
export class EditProfile implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(false);
  activeTab = signal(0);
  hideCurrentPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmPassword = signal(true);

  user = this.authService.currentUser;

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^\+?[0-9]{7,15}$/)]],
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator }
  );

  ngOnInit(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone ?? '',
      });
    }

    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'password') {
        this.activeTab.set(1);
      }
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { firstName, lastName, phone } = this.profileForm.value;
    this.authService.updateProfile({
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      phone: phone ?? undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard/profile']);
      },
      error: () => this.loading.set(false),
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword!, confirmPassword: confirmPassword! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.passwordForm.reset();
        this.router.navigate(['/dashboard/profile']);
      },
      error: () => this.loading.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/profile']);
  }
}
