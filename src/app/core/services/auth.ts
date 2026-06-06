import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { TokenService } from './token';
import { LocalStorageService } from './local-storage';
import { NotificationService } from './notification';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ApiResponse,
} from '../models/api-response.model';
import { User, UpdateUserDto, ChangePasswordDto } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private storage = inject(LocalStorageService);
  private notification = inject(NotificationService);

  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticatedSignal = this._isAuthenticated.asReadonly();
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');
  readonly userFullName = computed(() => {
    const user = this._currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor() {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    const token = this.tokenService.getAccessToken();
    const user = this.storage.get<User>(environment.userKey);
    if (token && user && !this.tokenService.isTokenExpired(token)) {
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
    } else if (token) {
      this.clearSession();
    }
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  login(dto: LoginDto): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/login`, dto)
      .pipe(
        tap((res) => {
          this.setSession(res.data);
          this.notification.success('Bienvenido de vuelta!');
        }),
        catchError((err) => {
          const msg = err.error?.message || 'Error al iniciar sesión';
          this.notification.error(msg);
          return throwError(() => err);
        })
      );
  }

  register(dto: RegisterDto): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/register`, dto)
      .pipe(
        tap((res) => {
          this.setSession(res.data);
          this.notification.success('Cuenta creada exitosamente!');
        }),
        catchError((err) => {
          const msg = err.error?.message || 'Error al registrarse';
          this.notification.error(msg);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {})
      .subscribe({
        complete: () => this.clearSession(),
        error: () => this.clearSession(),
      });
  }

  forgotPassword(dto: ForgotPasswordDto): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(`${environment.apiUrl}/auth/forgot-password`, dto)
      .pipe(
        tap(() => this.notification.success('Email de recuperación enviado')),
        catchError((err) => {
          this.notification.error(err.error?.message || 'Error al enviar email');
          return throwError(() => err);
        })
      );
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiUrl}/auth/refresh-token`, {
        refreshToken,
      })
      .pipe(
        tap((res) => this.setSession(res.data)),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        })
      );
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        this._currentUser.set(res.data);
        this.storage.set(environment.userKey, res.data);
      })
    );
  }

  updateProfile(dto: UpdateUserDto): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/auth/me`, dto).pipe(
      tap((res) => {
        this._currentUser.set(res.data);
        this.storage.set(environment.userKey, res.data);
        this.notification.success('Perfil actualizado correctamente');
      }),
      catchError((err) => {
        this.notification.error(err.error?.message || 'Error al actualizar perfil');
        return throwError(() => err);
      })
    );
  }

  changePassword(dto: ChangePasswordDto): Observable<ApiResponse<void>> {
    return this.http
      .put<ApiResponse<void>>(`${environment.apiUrl}/auth/change-password`, dto)
      .pipe(
        tap(() => this.notification.success('Contraseña actualizada correctamente')),
        catchError((err) => {
          this.notification.error(err.error?.message || 'Error al cambiar contraseña');
          return throwError(() => err);
        })
      );
  }

  private setSession(data: AuthResponse): void {
    this.tokenService.setTokens(data.accessToken, data.refreshToken);
    this.storage.set(environment.userKey, data.user);
    this._currentUser.set(data.user);
    this._isAuthenticated.set(true);
  }

  private clearSession(): void {
    this.tokenService.clearTokens();
    this.storage.remove(environment.userKey);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }
}
