import { Routes } from '@angular/router';
import { CreditStudy } from './credit-study';

export default [
    { path: '', component: CreditStudy },
    { path: 'detalle-estudio', title: 'Nuevo estudio de crédito', loadComponent: () => import('./credit-study-detail/credit-study-detail').then((c) => c.CreditStudyDetail) },
    { path: 'detalle-estudio/:id', title: 'Detalle del estudio', loadComponent: () => import('./credit-study-detail/credit-study-detail').then((c) => c.CreditStudyDetail) },
    { path: 'estudio-capacidad', title: 'Nuevo estudio de capacidad de pago', loadComponent: () => import('./payment-capacity/payment-capacity-detail/payment-capacity-detail').then((c) => c.PaymentCapacityDetail) },
    { path: 'estudio-capacidad/:id', title: 'Detalle del estudio de capacidad', loadComponent: () => import('./payment-capacity/payment-capacity-detail/payment-capacity-detail').then((c) => c.PaymentCapacityDetail) }
] as Routes;
