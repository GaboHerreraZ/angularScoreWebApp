import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-credits-indicator',
    standalone: true,
    imports: [CommonModule, RouterModule, TooltipModule],
    template: `
        @if (hasPermissions()) {
            <a
                routerLink="/app/administracion/analisis-credito"
                class="credits-indicator inline-flex items-center gap-2.5 pl-3 pr-1.5 py-1 rounded-full border transition-colors select-none cursor-pointer no-underline"
                [ngClass]="hasCredits()
                    ? 'bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/60'"
                pTooltip="Análisis crediticios disponibles en tu plan"
                tooltipPosition="bottom"
            >
                <i
                    class="pi pi-bolt text-m"
                    [ngClass]="hasCredits() ? 'text-primary' : 'text-red-500'"
                ></i>
                <div class="flex flex-col leading-none">
                    <span class="text-[10px] uppercase tracking-wide text-surface-400 dark:text-surface-500">Análisis restantes</span>
                </div>
                <span
                    class="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-m font-bold tabular-nums"
                    [ngClass]="hasCredits()
                        ? 'bg-primary text-primary-contrast'
                        : 'bg-red-500 text-white'"
                >{{ availableCredits() }}</span>
            </a>
        }
    `
})
export class CreditsIndicator {
    private authService = inject(AuthService);

    private permissions = computed(() => this.authService.currentProfile()?.permissions);

    hasPermissions = computed(() => !!this.permissions());
    availableCredits = computed(() => this.permissions()?.availableCredits ?? 0);
    hasCredits = computed(() => this.permissions()?.hasCredits ?? false);
}
