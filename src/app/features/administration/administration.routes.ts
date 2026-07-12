import { Routes } from '@angular/router';
import { Administration } from './administration';
import { emailProviderGuard } from '@/app/core/guards/auth.guard';

export default [
    {
        path: '',
        component: Administration,
        children: [
            { path: '', redirectTo: 'perfil', pathMatch: 'full' },
            { path: 'perfil', title: 'Perfil', data: { breadcrumb: 'Perfil' }, loadComponent: () => import('./components/profile/profile').then((c) => c.Profile) },
            { path: 'empresa', title: 'Empresa', data: { breadcrumb: 'Empresa' }, loadComponent: () => import('./components/company/company').then((c) => c.Company) },
            { path: 'analisis-credito', title: 'Análisis de Crédito', data: { breadcrumb: 'Análisis de Crédito' }, loadComponent: () => import('./components/analysis-packs/analysis-packs').then((c) => c.AnalysisPacks) },
            { path: 'configuracion-dimensiones', title: 'Configuración Dimensiones', data: { breadcrumb: 'Configuración Dimensiones' }, loadComponent: () => import('./components/dimension-config/dimension-config').then((c) => c.DimensionConfig) },
            { path: 'seguridad', title: 'Seguridad', canActivate: [emailProviderGuard], data: { breadcrumb: 'Seguridad' }, loadComponent: () => import('./components/change-password/change-password').then((c) => c.ChangePassword) },
        ]
    }
] as Routes;
