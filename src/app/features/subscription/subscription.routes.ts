import { Routes } from '@angular/router';
import { authGuard } from '@/app/core/guards/auth.guard';

export default [
    {
        path: 'registro',
        canActivate: [authGuard],
        loadComponent: () => import('./onboarding/onboarding').then(c => c.Onboarding)
    },
    {
        path: 'confirmacion',
        canActivate: [authGuard],
        loadComponent: () => import('./confirmation/confirmation').then(c => c.Confirmation)
    }
] as Routes;
