import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '@/app/core/services/auth.service';
import { CompanyDataIncompleteService } from './company-data-incomplete.service';

/**
 * Diálogo global "completa los datos de tu empresa": aparece cuando una acción
 * (crear estudio, emitir pagaré...) se bloquea por datos pendientes del
 * onboarding diferido. El CTA lleva a Administración → Empresa; para usuarios
 * sin rol administrador, indica pedírselo al administrador de la cuenta.
 */
@Component({
    selector: 'app-company-data-dialog',
    standalone: true,
    imports: [DialogModule, ButtonModule],
    template: `
        <p-dialog
            header="Faltan datos de tu empresa"
            [visible]="service.visible()"
            (visibleChange)="!$event && service.close()"
            [modal]="true"
            [style]="{ width: '30rem' }"
            [draggable]="false"
        >
            <div class="flex flex-col items-center gap-4 text-center">
                <span class="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <i class="pi pi-building text-2xl text-amber-500"></i>
                </span>
                <p class="text-color m-0">{{ service.message() }}</p>
                @if (!isAdmin()) {
                    <p class="text-muted-color text-m m-0">Pídele al administrador de tu cuenta que los complete.</p>
                }
            </div>

            <ng-template #footer>
                <div class="flex justify-end gap-2">
                    <p-button label="Ahora no" severity="secondary" [text]="true" (onClick)="service.close()" />
                    @if (isAdmin()) {
                        <p-button label="Completar datos" icon="pi pi-arrow-right" (onClick)="goToCompany()" />
                    }
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class CompanyDataDialog {
    service = inject(CompanyDataIncompleteService);
    private router = inject(Router);
    private authService = inject(AuthService);

    isAdmin = computed(() => this.authService.currentProfile()?.role === 'administrator');

    goToCompany(): void {
        this.service.close();
        void this.router.navigate(['/app/administracion/empresa']);
    }
}
