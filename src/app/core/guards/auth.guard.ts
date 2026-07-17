import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { AuthService } from '@/app/core/services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
    const supabaseService = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (supabaseService.isAuthenticated()) {
        // Cargar el perfil si no está cargado
        const user = supabaseService.currentUser();
        if (user?.id && !authService.currentProfile()) {
            await authService.loadProfile(user.id);
        }

        // El usuario está autenticado en Supabase pero aún no tiene perfil en el backend
        // (típico tras registrarse con Google sin completar el onboarding). Lo enviamos
        // al asistente paso a paso para que registre su empresa.
        const profile = authService.currentProfile();
        if (!profile) {
            return router.createUrlTree(['/onboarding/registrar-empresa']);
        }

        // Ruteo según el estado del onboarding. 'ready' y 'pending_contract' entran
        // a /app; este último con un modal bloqueante para firmar el contrato macro
        // (ver ContractSignatureGuard en el layout).
        if (profile.onboardingStatus === 'payment_pending') {
            return router.createUrlTree(['/onboarding/pago-pendiente']);
        }
        if (profile.onboardingStatus !== 'ready' && profile.onboardingStatus !== 'pending_contract') {
            // 'no_pack': tiene empresa pero falta comprar el paquete → asistente (paso 3).
            return router.createUrlTree(['/onboarding/registrar-empresa']);
        }

        // Bloquear al asistente cuyo acceso fue revocado en su empresa.
        if (profile.role === 'assistant' && !profile.isUserActiveInCompany) {
            return router.createUrlTree(['/'], { queryParams: { blocked: 'true' } });
        }

        return true;
    }

    return router.createUrlTree(['/auth/iniciar-sesion'], {
        queryParams: { returnUrl: state.url }
    });
};

/**
 * Protege el asistente de onboarding: exige sesión de Supabase pero NO exige perfil
 * (el usuario está aquí justamente para crear su empresa/perfil). Evita el bucle que
 * tendría `authGuard`, que redirige a los usuarios sin perfil a esta misma ruta.
 */
export const onboardingGuard: CanActivateFn = async (_route, state) => {
    const supabaseService = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (!supabaseService.isAuthenticated()) {
        return router.createUrlTree(['/auth/iniciar-sesion'], {
            queryParams: { returnUrl: state.url }
        });
    }

    const user = supabaseService.currentUser();
    if (user?.id && !authService.currentProfile()) {
        await authService.loadProfile(user.id);
    }

    // El asistente (paso 3) es solo para 'no_pack'. Si ya pagó (pending o ready),
    // no debe volver aquí: pago pendiente o dashboard según corresponda.
    const status = authService.currentProfile()?.onboardingStatus;
    if (status === 'payment_pending') {
        return router.createUrlTree(['/onboarding/pago-pendiente']);
    }
    if (status === 'ready' || status === 'pending_contract') {
        return router.createUrlTree(['/app']);
    }

    return true;
};

/**
 * Protege la pantalla de pago pendiente: solo para usuarios cuyo pago aún no se
 * confirma (`payment_pending`). Al resto lo reencamina a donde corresponda para
 * que la ruta no sea accesible fuera de ese estado.
 */
export const paymentPendingGuard: CanActivateFn = async (_route, state) => {
    const supabaseService = inject(SupabaseService);
    const authService = inject(AuthService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (!supabaseService.isAuthenticated()) {
        return router.createUrlTree(['/auth/iniciar-sesion'], {
            queryParams: { returnUrl: state.url }
        });
    }

    const user = supabaseService.currentUser();
    if (user?.id && !authService.currentProfile()) {
        await authService.loadProfile(user.id);
    }

    const status = authService.currentProfile()?.onboardingStatus;
    if (status === 'payment_pending') {
        return true;
    }
    if (status === 'ready' || status === 'pending_contract') {
        return router.createUrlTree(['/app']);
    }
    // Sin perfil o 'no_pack': lo mandamos al asistente.
    return router.createUrlTree(['/onboarding/registrar-empresa']);
};

export const noAuthGuard: CanActivateFn = async () => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (supabaseService.isAuthenticated()) {
        return router.createUrlTree(['/app']);
    }

    return true;
};

/** Solo permite el acceso a usuarios con credenciales de correo/contraseña (los de OAuth no tienen contraseña que gestionar). */
export const emailProviderGuard: CanActivateFn = async () => {
    const supabaseService = inject(SupabaseService);
    const router = inject(Router);

    if (supabaseService.loading()) {
        await waitForLoading(supabaseService);
    }

    if (supabaseService.hasEmailProvider()) {
        return true;
    }

    return router.createUrlTree(['/app/administracion/perfil']);
};

function waitForLoading(service: SupabaseService): Promise<void> {
    return new Promise(resolve => {
        const check = () => {
            if (!service.loading()) {
                resolve();
            } else {
                setTimeout(check, 50);
            }
        };
        check();
    });
}
