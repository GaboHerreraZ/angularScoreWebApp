import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { environment } from '@/environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    if (req.url.includes(environment.supabaseUrl)) {
        return next(req);
    }

    if (!req.url.startsWith(environment.apiUrl)) {
        return next(req);
    }

    return from(supabaseService.getToken()).pipe(
        switchMap(token => {
            const clonedReq = token
                ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
                : req;
            return next(clonedReq);
        }),
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return from(supabaseService.refreshSession()).pipe(
                    switchMap(({ error: refreshError }) => {
                        if (refreshError) {
                            supabaseService.signOut();
                            router.navigate(['/auth/iniciar-sesion']);
                            return throwError(() => error);
                        }
                        return from(supabaseService.getToken()).pipe(
                            switchMap(newToken => {
                                const retryReq = req.clone({
                                    setHeaders: { Authorization: `Bearer ${newToken ?? ''}` }
                                });
                                return next(retryReq);
                            })
                        );
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
