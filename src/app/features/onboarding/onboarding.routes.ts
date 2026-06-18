import { Routes } from '@angular/router';
import { OnboardingShell } from './onboarding-shell';
import { authGuard, noAuthGuard } from '@/app/core/guards/auth.guard';

export default [
    // El registro tiene su propio layout de dos columnas (sin header de la shell).
    {
        path: 'registro',
        canActivate: [noAuthGuard],
        loadComponent: () => import('./register/onboarding-register').then((c) => c.OnboardingRegister)
    },
    {
        path: '',
        component: OnboardingShell,
        children: [
            { path: '', redirectTo: 'registro', pathMatch: 'full' },
            {
                path: 'registrar-empresa',
                canActivate: [authGuard],
                loadComponent: () => import('./wizard/onboarding-wizard').then((c) => c.OnboardingWizard)
            },
            { path: '**', redirectTo: 'registro' }
        ]
    }
] as Routes;
