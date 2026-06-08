/**
 * @file token.ts
 * @module core/services
 * @description Servicio para la gestión de tokens JWT en SportReserve-UPTC.
 * Encapsula el acceso, almacenamiento y validación de access token y refresh token
 * usando `LocalStorageService` como capa de persistencia.
 */

import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from './local-storage';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private storage = inject(LocalStorageService);

  /**
   * Obtiene el access token almacenado.
   *
   * @returns {string | null} El access token o `null` si no existe.
   */
  getAccessToken(): string | null {
    return this.storage.get<string>(environment.tokenKey);
  }

  /**
   * Obtiene el refresh token almacenado.
   *
   * @returns {string | null} El refresh token o `null` si no existe.
   */
  getRefreshToken(): string | null {
    return this.storage.get<string>(environment.refreshTokenKey);
  }

  /**
   * Almacena el access token y el refresh token en `localStorage`.
   *
   * @param {string} accessToken  - Token de acceso JWT.
   * @param {string} refreshToken - Token de refresco JWT.
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.storage.set(environment.tokenKey, accessToken);
    this.storage.set(environment.refreshTokenKey, refreshToken);
  }

  /**
   * Elimina ambos tokens del almacenamiento local.
   */
  clearTokens(): void {
    this.storage.remove(environment.tokenKey);
    this.storage.remove(environment.refreshTokenKey);
  }

  /**
   * Verifica si un token JWT está expirado comparando su campo `exp` con la fecha actual.
   *
   * @param {string} token - Token JWT a verificar.
   * @returns {boolean} `true` si el token está expirado o es inválido.
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Decodifica el payload de un token JWT sin verificar la firma.
   *
   * @param {string} token - Token JWT a decodificar.
   * @returns {Record<string, unknown> | null} Payload decodificado o `null` si el token es inválido.
   */
  decodeToken(token: string): Record<string, unknown> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}