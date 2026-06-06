import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notification.error('Sin conexión al servidor. Verifique su internet.');
      } else if (error.status === 403) {
        notification.error('No tiene permiso para realizar esta acción.');
        router.navigate(['/dashboard']);
      } else if (error.status === 404) {
        notification.error('Recurso no encontrado.');
      } else if (error.status >= 500) {
        notification.error('Error interno del servidor. Intente más tarde.');
      }
      return throwError(() => error);
    })
  );
};
