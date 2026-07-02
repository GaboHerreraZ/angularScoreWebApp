import { Routes } from '@angular/router';
import { OnboardingShell } from './onboarding-shell';
import { onboardingGuard, paymentPendingGuard, noAuthGuard } from '@/app/core/guards/auth.guard';

export default [
    // El registro tiene su propio layout de dos columnas (sin header de la shell).
    {
        path: 'registro',
        title: 'Crear cuenta',
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
                title: 'Registra tu empresa',
                canActivate: [onboardingGuard],
                loadComponent: () => import('./wizard/onboarding-wizard').then((c) => c.OnboardingWizard)
            },
            {
                path: 'pago-pendiente',
                title: 'Pago pendiente',
                canActivate: [paymentPendingGuard],
                loadComponent: () => import('./payment-pending/onboarding-payment-pending').then((c) => c.OnboardingPaymentPending)
            },
            { path: '**', redirectTo: 'registro' }
        ]
    }
] as Routes;
