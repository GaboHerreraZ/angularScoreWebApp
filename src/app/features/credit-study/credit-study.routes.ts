import { Routes } from '@angular/router';
import { CreditStudy } from './credit-study';

export default [
    { path: '', component: CreditStudy },
    { path: 'detalle-estudio', title: 'Nuevo estudio de crédito', loadComponent: () => import('./credit-study-detail/credit-study-detail').then((c) => c.CreditStudyDetail) },
    { path: 'detalle-estudio/:id', title: 'Detalle del estudio', loadComponent: () => import('./credit-study-detail/credit-study-detail').then((c) => c.CreditStudyDetail) }
] as Routes;
