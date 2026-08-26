import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';
import { setupPendingItems } from './setup-items';

/**
 * Checklist de configuración pendiente (onboarding diferido): lista lo que
 * falta por completar (datos de empresa, representante legal, bancarios,
 * perfil) con el link directo a la pantalla donde se resuelve. NO es
 * descartable a propósito: desaparece solo cuando ya no falta nada — si se
 * pudiera cerrar, el usuario perdería la única lista de qué le falta.
 */
@Component({
    selector: 'app-setup-checklist',
    standalone: true,
    imports: [RouterModule],
    template: `
        @if (items().length > 0) {
            <div class="rounded-2xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-4 sm:p-5 mb-6">
                <div class="flex items-center gap-2 mb-3">
                    <i class="pi pi-list-check text-amber-600 dark:text-amber-400"></i>
                    <span class="font-bold text-color">Termina de configurar tu cuenta</span>
                </div>
                <ul class="list-none m-0 p-0 grid grid-cols-1 lg:grid-cols-2 gap-2">
                    @for (item of items(); track item.title) {
                        <li>
                            <a
                                [routerLink]="item.link"
                                class="flex items-center gap-3 rounded-xl border border-surface bg-surface-0 dark:bg-surface-900 px-4 py-3 no-underline transition-colors hover:border-primary/50"
                            >
                                <span class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <i class="pi {{ item.icon }} text-amber-600 dark:text-amber-400"></i>
                                </span>
                                <span class="flex-1 min-w-0">
                                    <span class="block font-semibold text-color text-m">{{ item.title }}</span>
                                    <span class="block text-muted-color text-sm truncate">{{ item.subtitle }}</span>
                                </span>
                                <i class="pi pi-arrow-right text-muted-color text-sm shrink-0"></i>
                            </a>
                        </li>
                    }
                </ul>
            </div>
        }
    `
})
export class SetupChecklist {
    private authService = inject(AuthService);

    items = computed(() => setupPendingItems(this.authService.currentProfile()));
}
