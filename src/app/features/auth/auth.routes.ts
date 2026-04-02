import { Routes } from '@angular/router';
import { AccessDenied } from './component/accessdenied';
import { Error } from './component/error';
import { Login } from './component/login';
import { Register } from './component/register';
import { Callback } from './component/callback';

export default [
    { path: 'iniciar-sesion', component: Login },
    { path: 'registro', component: Register },
    { path: 'callback', component: Callback },
    { path: 'error', component: Error },
    { path: 'acceso-denegado', component: AccessDenied },
    { path: '', redirectTo: 'iniciar-sesion', pathMatch: 'full' as const },
    { path: '**', redirectTo: '/no-encontrado' }
] as Routes;
