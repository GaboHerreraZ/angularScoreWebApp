import { Routes } from '@angular/router';
import { noAuthGuard } from '@/app/core/guards/auth.guard';
import { AccessDenied } from './component/accessdenied/accessdenied';
import { Error } from './component/error/error';
import { Login } from './component/login/login';
import { Register } from './component/register/register';
import { Callback } from './component/callback/callback';
import { ForgotPassword } from './component/forgotpassword/forgotpassword';
import { NewPassword } from './component/newpassword/newpassword';

export default [
    { path: 'iniciar-sesion', component: Login, canActivate: [noAuthGuard] },
    { path: 'registro', component: Register, canActivate: [noAuthGuard] },
    { path: 'recuperar-contrasena', component: ForgotPassword },
    { path: 'nueva-contrasena', component: NewPassword },
    { path: 'callback', component: Callback },
    { path: 'error', component: Error },
    { path: 'acceso-denegado', component: AccessDenied },
    { path: '', redirectTo: 'iniciar-sesion', pathMatch: 'full' as const },
    { path: '**', redirectTo: '/no-encontrado' }
] as Routes;
