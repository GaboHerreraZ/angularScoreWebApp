import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { EpaycoCheckoutLoader } from '@/app/shared/components/epayco-checkout/epayco-checkout.service';
import { AnalysisPack } from '@/app/types/analysis-pack';

/** Auto-verificación: cada 10s consultamos si el pago ya se confirmó. */
const POLL_INTERVAL_MS = 10_000;
const SUPPORT_EMAIL = 'soporte@creditia.co';

/**
 * Pantalla para usuarios cuyo pago quedó en `payment_pending`: ya compraron un
 * paquete pero el pago aún no se confirma. Cubre el caso en que el usuario
 * abandonó el checkout (refresh/cierre): muestra el resumen del pack que estaba
 * comprando y permite reintentar el pago (reabrir ePayco) sin volver al paso 3.
 * También hace polling del perfil por si el webhook confirma el pago en background.
 */
@Component({
    selector: 'app-onboarding-payment-pending',
    standalone: true,
    imports: [RouterModule, ButtonModule, DividerModule, SkeletonModule, EpaycoCheckout],
    templateUrl: './onboarding-payment-pending.html'
})
export class OnboardingPaymentPending {
    private router = inject(Router);
    private authService = inject(AuthService);
    private notification = inject(NotificationService);
    private analysisPacksService = inject(AnalysisPacksService);
    private checkoutLoader = inject(EpaycoCheckoutLoader);
    private destroyRef = inject(DestroyRef);

    checkout = viewChild.required<EpaycoCheckout>('checkout');

    /** Pack pendiente de pago (lo que el usuario intentaba comprar). */
    pendingPack = signal<AnalysisPack | null>(null);
    /** True mientras cargamos el pack pendiente. */
    loadingPack = signal(true);
    /** True mientras se consulta el estado del pago (deshabilita "verificar"). */
    checking = signal(false);
    /** True mientras se reabre el checkout. */
    retrying = signal(false);
    /** sessionId de ePayco devuelto al reintentar; alimenta el checkout. */
    sessionId = signal<string>('');

    private timer: ReturnType<typeof setInterval> | null = null;

    private profile = computed(() => this.authService.currentProfile());

    /** mailto prellenado con el contexto del usuario para agilizar el soporte. */
    supportMailto = computed(() => {
        const p = this.profile();
        const subject = `Pago pendiente${p?.companyName ? ` - ${p.companyName}` : ''}`;
        const body =
            `Hola equipo de soporte,\n\n` +
            `Mi pago sigue en estado pendiente y no puedo acceder a mi cuenta.\n\n` +
            `Datos de mi cuenta:\n` +
            `- Nombre: ${p?.name ?? ''} ${p?.lastName ?? ''}\n` +
            `- Correo: ${p?.email ?? ''}\n` +
            `- Empresa: ${p?.companyName ?? ''}\n` +
            `- NIT: ${p?.companyNit ?? ''}\n\n` +
            `Gracias.`;
        return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    readonly supportEmail = SUPPORT_EMAIL;

    constructor() {
        this.loadPendingPack();
        // Precargamos el script de ePayco para que openNew() ocurra junto al click
        // y el navegador no bloquee el popup al reintentar.
        this.checkoutLoader.load().catch(() => { /* se reintenta al pagar */ });

        this.timer = setInterval(() => this.checkStatus(true), POLL_INTERVAL_MS);
        this.destroyRef.onDestroy(() => {
            if (this.timer) clearInterval(this.timer);
        });
    }

    private loadPendingPack(): void {
        this.loadingPack.set(true);
        this.analysisPacksService.getPendingPack().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (pack) => {
                this.pendingPack.set(pack);
                this.loadingPack.set(false);
            },
            error: () => {
                // Si no podemos cargar el resumen, la pantalla sigue usable
                // (verificar estado / soporte); no bloqueamos al usuario.
                this.loadingPack.set(false);
            }
        });
    }

    /** Vuelve a llamar a purchase para el mismo pack y reabre el checkout de ePayco. */
    async retryPayment(): Promise<void> {
        const pack = this.pendingPack();
        if (!pack || this.retrying()) return;

        this.retrying.set(true);
        try {
            const res = await firstValueFrom(
                this.analysisPacksService.purchasePack({ packOfferingId: pack.packOfferingId })
            );
            this.sessionId.set(res.sessionId);
            // Pasamos el id directo: el input aún no se propagó en este tick.
            await this.checkout().open(res.sessionId);
        } catch {
            this.notification.error('No se pudo reabrir el pago. Inténtalo de nuevo o contacta a soporte.');
        } finally {
            this.retrying.set(false);
        }
    }

    /** Refresca el perfil; si el pago ya se confirmó, entra al dashboard. */
    async checkStatus(silent = false): Promise<void> {
        if (this.checking()) return;
        this.checking.set(true);
        try {
            const profile = await this.authService.refreshProfile();
            if (profile?.onboardingStatus === 'ready') {
                if (this.timer) clearInterval(this.timer);
                this.notification.success('¡Tu pago fue confirmado! Bienvenido a Creditia.');
                this.router.navigateByUrl('/app');
                return;
            }
            if (!silent) {
                this.notification.info('Tu pago sigue en verificación. Te avisaremos apenas se confirme.');
            }
        } finally {
            this.checking.set(false);
        }
    }

    onCheckoutError(): void {
        this.notification.error('No se pudo abrir la pasarela de pago. Inténtalo de nuevo.');
    }

    formatCurrency(value: number, currency = 'COP'): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    }
}
