/**
 * @file notification.ts
 * @module core/services
 * @description Servicio para mostrar notificaciones tipo snackbar en SportReserve-UPTC.
 * Utiliza Angular Material `MatSnackBar` con carga lazy para optimizar el bundle inicial.
 * Compatible con SSR: no ejecuta nada fuera del navegador.
 *
 * Tipos de notificación disponibles:
 * - `success` → fondo verde, duración 4s.
 * - `error`   → fondo rojo, duración 5s.
 * - `warning` → fondo amarillo, duración 4s.
 * - `info`    → fondo azul, duración 4s.
 */

import { Injectable, PLATFORM_ID, Injector, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  /**
   * Muestra una notificación de éxito.
   *
   * @param {string} message  - Texto a mostrar.
   * @param {number} duration - Duración en ms (por defecto 4000).
   */
  success(message: string, duration = 4000): void {
    this.show(message, 'success-snackbar', duration);
  }

  /**
   * Muestra una notificación de error.
   *
   * @param {string} message  - Texto a mostrar.
   * @param {number} duration - Duración en ms (por defecto 5000).
   */
  error(message: string, duration = 5000): void {
    this.show(message, 'error-snackbar', duration);
  }

  /**
   * Muestra una notificación de advertencia.
   *
   * @param {string} message  - Texto a mostrar.
   * @param {number} duration - Duración en ms (por defecto 4000).
   */
  warning(message: string, duration = 4000): void {
    this.show(message, 'warning-snackbar', duration);
  }

  /**
   * Muestra una notificación informativa.
   *
   * @param {string} message  - Texto a mostrar.
   * @param {number} duration - Duración en ms (por defecto 4000).
   */
  info(message: string, duration = 4000): void {
    this.show(message, 'info-snackbar', duration);
  }

  /**
   * Método interno que renderiza el snackbar con la clase CSS y duración indicadas.
   * Importa `MatSnackBar` de forma lazy y lo obtiene del injector para evitar
   * dependencia directa en el bundle principal.
   *
   * @param {string} message    - Texto del mensaje.
   * @param {string} panelClass - Clase CSS que define el estilo visual.
   * @param {number} duration   - Duración en ms antes de cerrar automáticamente.
   */
  private show(message: string, panelClass: string, duration: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    import('@angular/material/snack-bar').then(({ MatSnackBar }) => {
      const snackBar = this.injector.get(MatSnackBar, null);
      if (!snackBar) return;
      snackBar.open(message, 'Cerrar', {
        duration,
        panelClass: [panelClass],
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    });
  }
}