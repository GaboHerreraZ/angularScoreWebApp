import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
    const supabaseService = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (supabaseService.isAuthenticated()) {
        // Cargar el perfil si no está cargado
        const user = supabaseService.currentUser();
        if (user?.id && !authService.currentProfile()) {
            await authService.loadProfile(user.id);
        }
        return true;
    }

    return router.createUrlTree(['/auth/iniciar-sesion'], {
        queryParams: { returnUrl: state.url }
    });
};

export const noAuthGuard: CanActivateFn = async () => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (supabaseService.isAuthenticated()) {
        return router.createUrlTree(['/']);
    }

    return true;
};

function waitForLoading(service: SupabaseService): Promise<void> {
    return new Promise(resolve => {
        const check = () => {
            if (!service.loading()) {
                resolve();
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}
