import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/app/core/services/auth.service';

export const subscriptionGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const profile = authService.currentProfile();

    if (!profile) {
        return router.createUrlTree(['/suscripcion/registro']);
    }

    const userCompanies = profile.userCompanies;
    if (!userCompanies?.length) {
        return router.createUrlTree(['/suscripcion/registro']);
    }

    const company = userCompanies[0].company;
    if (!company?.companySubscriptions?.length) {
        return router.createUrlTree(['/suscripcion/registro']);
    }


    return true;
};
