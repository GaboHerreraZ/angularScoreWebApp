import { Routes } from '@angular/router';
import { Administration } from './administration';
import { emailProviderGuard } from '@/app/core/guards/auth.guard';

export default [
    {
        path: '',
        component: Administration,
        children: [
            { path: '', redirectTo: 'perfil', pathMatch: 'full' },
            { path: 'perfil', data: { breadcrumb: 'Perfil' }, loadComponent: () => import('./components/profile/profile').then((c) => c.Profile) },
            { path: 'empresa', data: { breadcrumb: 'Empresa' }, loadComponent: () => import('./components/company/company').then((c) => c.Company) },
            { path: 'suscripcion', data: { breadcrumb: 'Suscripción' }, loadComponent: () => import('./components/plan-billing/plan-billing').then((c) => c.PlanBilling) },
            { path: 'seguridad', canActivate: [emailProviderGuard], data: { breadcrumb: 'Seguridad' }, loadComponent: () => import('./components/change-password/change-password').then((c) => c.ChangePassword) },
        ]
    }
] as Routes;
