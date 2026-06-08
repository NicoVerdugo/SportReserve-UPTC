/**
 * @file auth.ts
 * @module core/services
 * @description Servicio principal de autenticación para SportReserve-UPTC.
 * Gestiona el ciclo de vida de la sesión del usuario: login, registro, logout,
 * recuperación de contraseña y refresco de token.
 *
 * Utiliza Angular Signals para el estado reactivo del usuario autenticado.
 *
 * Estado expuesto:
 * - `currentUser`           → usuario autenticado actual (readonly signal).
 * - `isAuthenticatedSignal` → booleano reactivo de autenticación.
 * - `isAdmin`               → computed: true si el usuario tiene rol `ADMIN`.
 * - `userFullName`          → computed: nombre completo del usuario.
 */

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

  /** `true` si el usuario autenticado tiene rol `ADMIN`. */
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  /** Nombre completo del usuario autenticado (`firstName lastName`). */
  readonly userFullName = computed(() => {
    const user = this._currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Restaura la sesión desde el almacenamiento local al inicializar el servicio.
   * Si el token existe pero está expirado, limpia la sesión automáticamente.
   */
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

  /**
   * Retorna el estado de autenticación actual de forma síncrona.
   *
   * @returns {boolean} `true` si el usuario está autenticado.
   */
  isAuthenticated(): boolean {
    return this._isAuthenticated();
  }

  /**
   * Inicia sesión con email y contraseña.
   * Almacena tokens y datos del usuario en sesión al completarse.
   *
   * @param {LoginDto} dto - Credenciales del usuario.
   * @returns {Observable<ApiResponse<AuthResponse>>}
   */
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

  /**
   * Registra un nuevo usuario y lo autentica automáticamente.
   *
   * @param {RegisterDto} dto - Datos del nuevo usuario.
   * @returns {Observable<ApiResponse<AuthResponse>>}
   */
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

  /**
   * Cierra la sesión del usuario actual.
   * Notifica al backend y limpia la sesión local independientemente del resultado.
   */
  logout(): void {
    this.http
      .post<void>(`${environment.apiUrl}/auth/logout`, {})
      .subscribe({
        complete: () => this.clearSession(),
        error: () => this.clearSession(),
      });
  }

  /**
   * Envía un email de recuperación de contraseña al usuario.
   *
   * @param {ForgotPasswordDto} dto - Email del usuario.
   * @returns {Observable<ApiResponse<void>>}
   */
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

  /**
   * Refresca el access token usando el refresh token almacenado.
   * Limpia la sesión si el refresco falla.
   *
   * @returns {Observable<ApiResponse<AuthResponse>>}
   */
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

  /**
   * Obtiene el perfil actualizado del usuario autenticado desde el backend
   * y sincroniza el estado local.
   *
   * @returns {Observable<ApiResponse<User>>}
   */
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        this._currentUser.set(res.data);
        this.storage.set(environment.userKey, res.data);
      })
    );
  }

  /**
   * Actualiza los datos del perfil del usuario autenticado.
   *
   * @param {UpdateUserDto} dto - Campos a actualizar.
   * @returns {Observable<ApiResponse<User>>}
   */
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

  /**
   * Cambia la contraseña del usuario autenticado.
   *
   * @param {ChangePasswordDto} dto - Contraseña actual y nueva contraseña.
   * @returns {Observable<ApiResponse<void>>}
   */
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

  /**
   * Almacena tokens y datos del usuario en memoria y en almacenamiento local.
   *
   * @param {AuthResponse} data - Respuesta de autenticación con tokens y usuario.
   */
  private setSession(data: AuthResponse): void {
    this.tokenService.setTokens(data.accessToken, data.refreshToken);
    this.storage.set(environment.userKey, data.user);
    this._currentUser.set(data.user);
    this._isAuthenticated.set(true);
  }

  /**
   * Limpia tokens, datos de usuario y redirige al login.
   */
  private clearSession(): void {
    this.tokenService.clearTokens();
    this.storage.remove(environment.userKey);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }
}