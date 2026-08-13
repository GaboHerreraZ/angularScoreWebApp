import { Routes } from '@angular/router';
import { Layout } from '@/app/layout/components/layout';
import { authGuard } from '@/app/core/guards/auth.guard';

export const appRoutes: Routes = [
    { path: '', title: 'Análisis de crédito con IA para empresas', loadComponent: () => import('@/app/features/landing/landing').then((c) => c.Landing) },
    { path: 'precios', title: 'Precios', loadComponent: () => import('@/app/features/landing/pages/pricing/pricing-page').then((c) => c.PricingPage) },
    { path: 'agendar-demo', title: 'Agendar demo', loadComponent: () => import('@/app/features/landing/pages/demo/demo-page').then((c) => c.DemoPage) },
    {
        path: 'app',
        component: Layout,
        canActivate: [authGuard],
        children: [
            { path: '', title: 'Dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('@/app/features/dashboard/dashboard').then((c) => c.Dashboard) },
            { path: 'panel', title: 'Dashboard', data: { breadcrumb: 'Dashboard' }, loadComponent: () => import('@/app/features/dashboard/dashboard').then((c) => c.Dashboard) },
            { path: 'clientes', title: 'Clientes', data: { breadcrumb: 'Clientes' }, loadChildren: () => import('@/app/features/customers/customers.routes') },
            { path: 'estudio-credito', title: 'Estudios de Crédito', data: { breadcrumb: 'Estudio de Crédito' }, loadChildren: () => import('@/app/features/credit-study/credit-study.routes') },
            { path: 'pagares', title: 'Pagarés', data: { breadcrumb: 'Pagarés' }, loadChildren: () => import('@/app/features/promissory-notes/promissory-notes.routes') },
            { path: 'administracion', title: 'Administración', data: { breadcrumb: 'Administración' }, loadChildren: () => import('@/app/features/administration/administration.routes') }
        ]
    },
    { path: 'blog', loadChildren: () => import('@/app/features/blog/blog.routes') },
    { path: 'invitacion', title: 'Invitación', loadComponent: () => import('@/app/features/invitation/invitation').then(c => c.InvitationComponent) },
    { path: 'onboarding', loadChildren: () => import('@/app/features/onboarding/onboarding.routes') },
    {
        path: 'pago',
        loadComponent: () => import('@/app/features/onboarding/onboarding-shell').then((c) => c.OnboardingShell),
        children: [
            { path: 'resultado', title: 'Resultado del pago', loadComponent: () => import('@/app/features/onboarding/confirmation/onboarding-confirmation').then((c) => c.OnboardingConfirmation) }
        ]
    },
    { path: 'auth', loadChildren: () => import('@/app/features/auth/auth.routes') },
    { path: 'inicio', redirectTo: '/', pathMatch: 'full' },
    { path: 'legal/privacidad', title: 'Política de Privacidad', loadComponent: () => import('@/app/features/legal/privacy-policy').then((c) => c.PrivacyPolicy) },
    { path: 'legal/terminos', title: 'Términos y Condiciones', loadComponent: () => import('@/app/features/legal/terms-conditions').then((c) => c.TermsConditions) },
    { path: 'legal/habeas-data', title: 'Habeas Data', loadComponent: () => import('@/app/features/legal/habeas-data').then((c) => c.HabeasData) },
    { path: 'servicio-no-disponible', title: 'Servicio no disponible', loadComponent: () => import('@/app/features/service-unavailable/service-unavailable').then((c) => c.ServiceUnavailable) },
    { path: 'no-encontrado', title: 'Página no encontrada', loadComponent: () => import('@/app/features/not-found/not-found').then((c) => c.NotFound) },
    { path: '**', redirectTo: '/no-encontrado' }
];
