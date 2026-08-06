import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

/**
 * Modal bloqueante para usuarios que aún no han firmado el contrato macro.
 *
 * El backend devuelve `contract.isSigned = false` (y `onboardingStatus = 'pending_contract'`)
 * cuando el usuario ya completó el onboarding pero falta la firma. En ese caso el authGuard
 * lo deja entrar a la app, pero este componente —montado en el layout— muestra un diálogo
 * no cerrable que le impide operar hasta que firme en ZapSign.
 *
 * Ofrece dos acciones: abrir ZapSign para firmar, y verificar si ya firmó (refresca el
 * perfil; si la firma quedó registrada, el modal se cierra solo).
 */
@Component({
    selector: 'app-contract-signature-guard',
    standalone: true,
    imports: [DialogModule, ButtonModule],
    templateUrl: './contract-signature-guard.html'
})
export class ContractSignatureGuard {
    private authService = inject(AuthService);
    private notification = inject(NotificationService);

    /** True mientras se verifica el estado de la firma contra el backend. */
    checking = signal(false);

    private profile = computed(() => this.authService.currentProfile());
    private contract = computed(() => this.profile()?.contract ?? null);

    /** El contrato fue rechazado por el firmante. */
    refused = computed(() => {
        const c = this.contract();
        return c?.status === 'refused' || !!c?.refusedAt;
    });

    /** URL de firma de ZapSign, si el backend la proporcionó. */
    signUrl = computed(() => this.contract()?.signUrl ?? null);

    /**
     * El modal se muestra cuando hay un contrato asociado y todavía no está firmado.
     * Perfiles antiguos sin objeto `contract` (o ya firmados) no lo ven.
     */
    visible = computed(() => {
        const p = this.profile();
        if (!p) return false;
        const c = p.contract;
        return !!c && !c.isSigned;
    });

    /** Abre ZapSign en una pestaña nueva para que el usuario firme. */
    openSignUrl(): void {
        const url = this.signUrl();
        if (!url) {
            this.notification.error('No encontramos el enlace de firma. Contacta a soporte para continuar.');
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    /** Refresca el perfil; si la firma ya quedó registrada, el modal se cierra solo. */
    async verifySignature(): Promise<void> {
        if (this.checking()) return;
        this.checking.set(true);
        try {
            const profile = await this.authService.refreshProfile();
            if (profile?.contract?.isSigned) {
                this.notification.success('¡Gracias! Tu contrato quedó firmado. Ya puedes usar Credit-ia.');
                return;
            }
            this.notification.info('Aún no detectamos tu firma. Si acabas de firmar, espera unos segundos e inténtalo de nuevo.');
        } finally {
            this.checking.set(false);
        }
    }
}
