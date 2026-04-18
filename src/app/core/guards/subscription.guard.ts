import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';

export const subscriptionGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

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
