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
    { path: 'iniciar-sesion', title: 'Iniciar sesión', component: Login, canActivate: [noAuthGuard] },
    { path: 'registro', title: 'Crear cuenta', component: Register, canActivate: [noAuthGuard] },
    { path: 'recuperar-contrasena', title: 'Recuperar contraseña', component: ForgotPassword },
    { path: 'nueva-contrasena', title: 'Nueva contraseña', component: NewPassword },
    { path: 'callback', component: Callback },
    { path: 'error', title: 'Error', component: Error },
    { path: 'acceso-denegado', title: 'Acceso denegado', component: AccessDenied },
    { path: '', redirectTo: 'iniciar-sesion', pathMatch: 'full' as const },
    { path: '**', redirectTo: '/no-encontrado' }
] as Routes;
