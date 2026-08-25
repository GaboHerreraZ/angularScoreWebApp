import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { CompanyDataIncompleteService } from '@/app/shared/components/company-data-dialog/company-data-incomplete.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);
    const supabaseService = inject(SupabaseService);
    const companyDataIncomplete = inject(CompanyDataIncompleteService);
    const router = inject(Router);

    const silent = req.headers.has('X-Silent-Error');
    const cleanReq = silent ? req.clone({ headers: req.headers.delete('X-Silent-Error') }) : req;

    return next(cleanReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Datos de empresa incompletos (onboarding diferido): diálogo con el
            // CTA a Administración → Empresa en vez del toast genérico. Aplica
            // también a peticiones silenciosas: el aviso es la UX del gate.
            if (error.status === 400 && error.error?.code === 'COMPANY_DATA_INCOMPLETE') {
                companyDataIncomplete.open(error.error?.message ?? 'Completa los datos de tu empresa para continuar.');
                return throwError(() => error);
            }

            if (silent) return throwError(() => error);

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
