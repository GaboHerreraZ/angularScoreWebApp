import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@/app/core/services/auth.service';
import { setupPendingItems } from './setup-items';

/**
 * Píldora del topbar con los pendientes de configuración (onboarding diferido).
 * Visible mientras falte algo; el tooltip enumera qué falta y el click lleva a
 * la pantalla del primer pendiente.
 */
@Component({
    selector: 'app-setup-pending-indicator',
    standalone: true,
    imports: [RouterModule, TooltipModule],
    template: `
        @if (count() > 0) {
            <a
                [routerLink]="link()"
                class="inline-flex items-center gap-1.5 sm:gap-2 shrink-0 pl-2 sm:pl-3 pr-1.5 py-1 rounded-full border transition-colors select-none cursor-pointer no-underline bg-amber-50 dark:bg-amber-500/10 border-amber-300/70 dark:border-amber-500/40"
                [pTooltip]="tooltip()"
                tooltipPosition="bottom"
            >
                <i class="pi pi-exclamation-circle text-m text-amber-600 dark:text-amber-400"></i>
                <span class="hidden sm:block text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-300 leading-none">Completar datos</span>
                <span class="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-m font-bold tabular-nums bg-amber-500 text-white">{{ count() }}</span>
            </a>
        }
    `
})
export class SetupPendingIndicator {
    private authService = inject(AuthService);

    private items = computed(() => setupPendingItems(this.authService.currentProfile()));

    count = computed(() => this.items().length);
    link = computed(() => this.items()[0]?.link ?? '/app/administracion/empresa');
    /** Enumera qué falta, para que el hover informe sin tener que navegar. */
    tooltip = computed(() => `Pendiente: ${this.items().map((i) => i.title.toLowerCase()).join(' · ')}`);
}
