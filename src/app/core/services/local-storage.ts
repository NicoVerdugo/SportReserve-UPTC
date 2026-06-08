/**
 * @file local-storage.ts
 * @module core/services
 * @description Servicio wrapper para el acceso seguro a `localStorage` en SportReserve-UPTC.
 * Maneja automáticamente la compatibilidad con SSR (Server-Side Rendering)
 * verificando si la ejecución ocurre en el navegador antes de cada operación.
 */

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private platformId = inject(PLATFORM_ID);

  /** `true` si el código se ejecuta en el navegador (no en SSR). */
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Guarda un valor serializado en `localStorage`.
   * No hace nada si se ejecuta fuera del navegador.
   *
   * @template T
   * @param {string} key   - Clave de almacenamiento.
   * @param {T} value      - Valor a guardar (se serializa con JSON.stringify).
   */
  set<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  /**
   * Recupera y deserializa un valor de `localStorage`.
   *
   * @template T
   * @param {string} key - Clave de almacenamiento.
   * @returns {T | null} El valor deserializado o `null` si no existe o hay error.
   */
  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Elimina una entrada específica de `localStorage`.
   *
   * @param {string} key - Clave a eliminar.
   */
  remove(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }

  /**
   * Limpia completamente el `localStorage`.
   * Usar con precaución ya que elimina todos los datos almacenados.
   */
  clear(): void {
    if (!this.isBrowser) return;
    localStorage.clear();
  }
}