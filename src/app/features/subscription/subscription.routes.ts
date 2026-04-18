import { Routes } from '@angular/router';

export default [
    {
        path: 'registro',
        loadComponent: () => import('./onboarding/onboarding').then(c => c.Onboarding)
    }
] as Routes;
