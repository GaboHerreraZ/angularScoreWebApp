import { Routes } from '@angular/router';
import { Administration } from './administration';

export default [
    {
        path: '',
        component: Administration,
        children: [
            { path: '', redirectTo: 'perfil', pathMatch: 'full' },
            { path: 'perfil', data: { breadcrumb: 'Perfil' }, loadComponent: () => import('./components/profile/profile').then((c) => c.Profile) },
            { path: 'empresa', data: { breadcrumb: 'Empresa' }, loadComponent: () => import('./components/company/company').then((c) => c.Company) },
            { path: 'plan-facturacion', data: { breadcrumb: 'Plan y Facturación' }, loadComponent: () => import('./components/plan-billing/plan-billing').then((c) => c.PlanBilling) },
            { path: 'parametros-analisis', data: { breadcrumb: 'Parámetros de Análisis' }, loadComponent: () => import('./components/analysis-parameters/analysis-parameters').then((c) => c.AnalysisParameters) }
        ]
    }
] as Routes;
