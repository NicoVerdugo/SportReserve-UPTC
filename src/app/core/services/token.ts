import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from './local-storage';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private storage = inject(LocalStorageService);

  getAccessToken(): string | null {
    return this.storage.get<string>(environment.tokenKey);
  }

  getRefreshToken(): string | null {
    return this.storage.get<string>(environment.refreshTokenKey);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.storage.set(environment.tokenKey, accessToken);
    this.storage.set(environment.refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    this.storage.remove(environment.tokenKey);
    this.storage.remove(environment.refreshTokenKey);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  decodeToken(token: string): Record<string, unknown> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
