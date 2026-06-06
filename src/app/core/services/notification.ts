import { Injectable, PLATFORM_ID, Injector, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  success(message: string, duration = 4000): void {
    this.show(message, 'success-snackbar', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error-snackbar', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning-snackbar', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info-snackbar', duration);
  }

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
