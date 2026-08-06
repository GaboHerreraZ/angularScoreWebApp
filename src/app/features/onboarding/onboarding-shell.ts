import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { Notification } from '@/app/shared/components/notification/notification';

/**
 * Marco visual del onboarding: logo de Credit-ia, acción de cerrar sesión
 * siempre disponible y footer legal. Envuelve el asistente de 4 pasos y la
 * confirmación mediante un <router-outlet> para acompañar al usuario.
 */
@Component({
    selector: 'app-onboarding-shell',
    standalone: true,
    imports: [RouterModule, ButtonModule, Notification],
    templateUrl: './onboarding-shell.html'
})
export class OnboardingShell {
    private supabaseService = inject(SupabaseService);
    private router = inject(Router);

    /**
     * El lockup horizontal contrasta sobre fondo claro y oscuro, asi que ya no
     * hace falta alternar el archivo segun el tema como con el logo anterior.
     */
    readonly logo = '/logo/logo-creditia-horizontal.svg';
    readonly year = new Date().getFullYear();

    async signOut(): Promise<void> {
        await this.supabaseService.signOut();
        this.router.navigateByUrl('/');
    }
}
