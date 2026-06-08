/**
 * @file loading.ts
 * @module core/services
 * @description Servicio para gestionar el estado global de carga en SportReserve-UPTC.
 * Utiliza un contador de peticiones activas para mostrar u ocultar el indicador
 * de carga solo cuando no hay solicitudes pendientes.
 *
 * Usado típicamente por el interceptor HTTP para mostrar un spinner global.
 */

import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = signal(false);
  private requestCount = 0;

  /** Signal readonly que indica si hay alguna carga activa. */
  readonly isLoading = this._loading.asReadonly();

  /**
   * Incrementa el contador de peticiones activas y activa el estado de carga.
   */
  show(): void {
    this.requestCount++;
    this._loading.set(true);
  }

  /**
   * Decrementa el contador de peticiones. Desactiva la carga cuando llega a cero.
   */
  hide(): void {
    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this._loading.set(false);
    }
  }

  /**
   * Fuerza la desactivación del estado de carga sin importar las peticiones pendientes.
   * Útil para manejar errores inesperados que dejen el spinner activo.
   */
  forceHide(): void {
    this.requestCount = 0;
    this._loading.set(false);
  }
}