import { Routes } from '@angular/router';
import { Layout } from '@/app/layout/components/layout';
import { authGuard } from '@/app/core/guards/auth.guard';
import { subscriptionGuard } from '@/app/core/guards/subscription.guard';

export const appRoutes: Routes = [
    { path: '', loadComponent: () => import('@/app/features/landing/landing').then((c) => c.Landing) },
    {
        path: 'app',
        component: Layout,
        canActivate: [authGuard, subscriptionGuard],
        children: [
            { path: '', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('@/app/features/dashboard/dashboard').then((c) => c.Dashboard) },
            { path: 'panel', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('@/app/features/dashboard/dashboard').then((c) => c.Dashboard) },
            { path: 'clientes', data: { breadcrumb: 'Clientes' }, loadChildren: () => import('@/app/features/customers/customers.routes') },
            { path: 'estudio-credito', data: { breadcrumb: 'Estudio de Crédito' }, loadChildren: () => import('@/app/features/credit-study/credit-study.routes') },
            { path: 'administracion', data: { breadcrumb: 'Administración' }, loadChildren: () => import('@/app/features/administration/administration.routes') }
        ]
    },
    { path: 'auth', loadChildren: () => import('@/app/features/auth/auth.routes') },
    { path: 'suscripcion', loadChildren: () => import('@/app/features/subscription/subscription.routes') },
    { path: 'inicio', redirectTo: '/', pathMatch: 'full' },
    { path: 'legal/privacidad', loadComponent: () => import('@/app/features/legal/privacy-policy').then((c) => c.PrivacyPolicy) },
    { path: 'legal/terminos', loadComponent: () => import('@/app/features/legal/terms-conditions').then((c) => c.TermsConditions) },
    { path: 'legal/habeas-data', loadComponent: () => import('@/app/features/legal/habeas-data').then((c) => c.HabeasData) },
    { path: 'no-encontrado', loadComponent: () => import('@/app/features/not-found/not-found').then((c) => c.NotFound) },
    { path: '**', redirectTo: '/no-encontrado' }
];
