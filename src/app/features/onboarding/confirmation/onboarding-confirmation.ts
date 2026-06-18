import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { OnboardingService } from '../onboarding.service';
import { AnalysisPackByReference } from '@/app/types/onboarding';

type ResultState = 'polling' | 'success' | 'declined' | 'pending' | 'error';

/** Polling: 15 intentos × 2s ≈ 30s máximo esperando que el webhook active el pack. */
const MAX_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 2000;

/**
 * Pantalla de resultado del pago (ePayco redirige aquí con ?ref_payco=...).
 * Hace polling a nuestro backend hasta que el pack quede `active`, y muestra
 * el resumen de la compra con la bienvenida y el acceso al dashboard.
 */
@Component({
    selector: 'app-onboarding-confirmation',
    standalone: true,
    imports: [RouterModule, ButtonModule, ProgressSpinnerModule, DividerModule],
    templateUrl: './onboarding-confirmation.html'
})
export class OnboardingConfirmation {
    private route = inject(ActivatedRoute);
    private destroyRef = inject(DestroyRef);
    private onboardingService = inject(OnboardingService);

    state = signal<ResultState>('polling');
    pack = signal<AnalysisPackByReference | null>(null);

    private attempts = 0;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    title = computed(() => {
        switch (this.state()) {
            case 'success': return '¡Bienvenido a Creditia!';
            case 'pending': return 'Tu pago está en proceso';
            case 'declined': return 'No se pudo procesar el pago';
            case 'error': return 'No pudimos confirmar tu pago';
            default: return 'Confirmando tu pago…';
        }
    });

    icon = computed(() => {
        switch (this.state()) {
            case 'success': return 'pi pi-check-circle text-green-500';
            case 'pending': return 'pi pi-clock text-amber-500';
            case 'declined': return 'pi pi-times-circle text-red-500';
            case 'error': return 'pi pi-exclamation-circle text-red-500';
            default: return '';
        }
    });

    constructor() {
        this.destroyRef.onDestroy(() => {
            this.destroyed = true;
            if (this.timer) clearTimeout(this.timer);
        });

        const refPayco = this.route.snapshot.queryParamMap.get('ref_payco');
        if (!refPayco) {
            this.state.set('error');
            return;
        }
        this.poll(refPayco);
    }

    private async poll(refPayco: string): Promise<void> {
        if (this.destroyed) return;
        this.attempts++;

        try {
            const result = await firstValueFrom(this.onboardingService.getPackByReference(refPayco));

            if (result.status === 'active') {
                this.pack.set(result);
                this.state.set('success');
                return;
            }
            if (result.status === 'cancelled') {
                this.pack.set(result);
                this.state.set('declined');
                return;
            }
            // 'pending_payment' o cualquier estado intermedio → seguimos esperando.
        } catch (error) {
            // 404 = el webhook aún no registró el ref. Es esperado al inicio: reintentar.
            const status = (error as HttpErrorResponse)?.status;
            if (status !== 404) {
                this.state.set('error');
                return;
            }
        }

        if (this.attempts >= MAX_ATTEMPTS) {
            // Se agotó la espera: el pago pudo completarse aunque el webhook tarde.
            this.state.set('pending');
            return;
        }

        this.timer = setTimeout(() => this.poll(refPayco), POLL_INTERVAL_MS);
    }

    formatCurrency(value: number, currency = 'COP'): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }
}
