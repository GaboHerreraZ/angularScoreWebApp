import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';
import { SupabaseService } from '@/app/core/services/supabase.service';

export const subscriptionGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (!authService.currentProfile()) {
        const userId = supabaseService.session()?.user?.id;
        if (userId) {
            await authService.loadProfile(userId);
        }
    }

    const profile = authService.currentProfile();

    if (!profile || !profile.hasCompany || !profile.permissions.hasSubscription) {
        return router.createUrlTree(['/suscripcion/registro']);
    }


    if (!profile.isUserActiveInCompany && profile.role === 'assistant') {
        return router.createUrlTree(['/'], {
            queryParams: { blocked: 'true' }
        });
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
