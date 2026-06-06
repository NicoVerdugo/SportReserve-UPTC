import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth';
import { RegisterDto } from '../../../../core/models/api-response.model';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', []],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch }
  );

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    const { firstName, lastName, email, phone, password, confirmPassword } = this.form.value;
    const dto: RegisterDto = {
      firstName: firstName!,
      lastName: lastName!,
      email: email!,
      password: password!,
      confirmPassword: confirmPassword!,
      phone: phone || undefined,
    };
    this.authService.register(dto).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  getFirstNameError(): string {
    const ctrl = this.form.get('firstName');
    if (ctrl?.hasError('required')) return 'El nombre es requerido';
    if (ctrl?.hasError('minlength')) return 'Minimo 2 caracteres';
    return '';
  }

  getLastNameError(): string {
    const ctrl = this.form.get('lastName');
    if (ctrl?.hasError('required')) return 'El apellido es requerido';
    if (ctrl?.hasError('minlength')) return 'Minimo 2 caracteres';
    return '';
  }

  getEmailError(): string {
    const ctrl = this.form.get('email');
    if (ctrl?.hasError('required')) return 'El email es requerido';
    if (ctrl?.hasError('email')) return 'Email invalido';
    return '';
  }

  getPasswordError(): string {
    const ctrl = this.form.get('password');
    if (ctrl?.hasError('required')) return 'La contrasena es requerida';
    if (ctrl?.hasError('minlength')) return 'Minimo 6 caracteres';
    return '';
  }

  getConfirmPasswordError(): string {
    const ctrl = this.form.get('confirmPassword');
    if (ctrl?.hasError('required')) return 'Confirma tu contrasena';
    if (this.form.hasError('passwordsMismatch')) return 'Las contrasenas no coinciden';
    return '';
  }
}
