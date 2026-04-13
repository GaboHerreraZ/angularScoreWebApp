import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { SupabaseService } from '@/app/core/services/supabase.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 0 && supabaseService.isAuthenticated()) {
                router.navigate(['/servicio-no-disponible']);
                return throwError(() => error);
            }

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
