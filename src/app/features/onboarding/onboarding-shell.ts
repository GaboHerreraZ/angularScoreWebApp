import { Component, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '@/app/layout/service/layout.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { Notification } from '@/app/shared/components/notification/notification';

/**
 * Marco visual del onboarding: logo de Creditia, acción de cerrar sesión
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
    private layoutService = inject(LayoutService);
    private supabaseService = inject(SupabaseService);
    private router = inject(Router);

    isDark = computed(() => this.layoutService.isDarkTheme());
    logo = computed(() => this.isDark() ? '/logo/creditia-logo-dark.svg' : '/logo/creditia-logo.svg');
    readonly year = new Date().getFullYear();

    async signOut(): Promise<void> {
        await this.supabaseService.signOut();
        this.router.navigateByUrl('/');
    }
}
