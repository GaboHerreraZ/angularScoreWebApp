import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const message = error.error?.message || error.error?.error || getDefaultMessage(error.status);
            notificationService.error(message);
            return throwError(() => error);
        })
    );
};

function getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
        400: 'Solicitud incorrecta',
        401: 'No autorizado',
        403: 'Acceso denegado',
        404: 'Recurso no encontrado',
        409: 'Conflicto con el estado actual',
        422: 'Datos no procesables',
        500: 'Error interno del servidor',
        503: 'Servicio no disponible'
    };
    return messages[status] ?? 'Ocurrió un error inesperado';
}
