import { Routes } from '@angular/router';
import { Customers } from './customers';

export default [
    { path: '', component: Customers },
    { path: 'detalle-cliente', loadComponent: () => import('./customer-detail/customer-detail').then((c) => c.CustomerDetail) },
    {
        path: 'detalle-cliente/:id',
        loadComponent: () => import('./customer-view/customer-view').then((c) => c.CustomerView),
        children: [
            { path: '', redirectTo: 'informacion', pathMatch: 'full' as const },
            {
                path: 'informacion',
                loadComponent: () => import('./customer-detail/customer-detail').then((c) => c.CustomerDetail)
            },
            {
                path: 'estudios-credito',
                loadComponent: () => import('./customer-view/customer-credit-studies/customer-credit-studies').then((c) => c.CustomerCreditStudies)
            }
        ]
    }
] as Routes;
