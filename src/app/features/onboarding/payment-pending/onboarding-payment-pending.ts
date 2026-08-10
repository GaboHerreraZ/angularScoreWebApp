import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, firstValueFrom, forkJoin, map } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { EpaycoCheckoutLoader } from '@/app/shared/components/epayco-checkout/epayco-checkout.service';
import { AnalysisPack } from '@/app/types/analysis-pack';
import { OnboardingByProfile, PackOffering } from '@/app/types/onboarding';
import { formatCurrency } from '@/app/shared/utils/format.util';
import { OnboardingService } from '../onboarding.service';
import { PurchaseSummary, onboardingSummaries } from '../purchase-summary/purchase-summary';

/** Auto-verificación: cada 10s consultamos si el pago ya se confirmó. */
const POLL_INTERVAL_MS = 10_000;
const SUPPORT_EMAIL = 'soporte@creditia.co';

/**
 * Pantalla para usuarios cuyo pago quedó en `payment_pending`: ya compraron un
 * paquete pero el pago aún no se confirma. Cubre el caso en que el usuario
 * abandonó el checkout (refresh/cierre): al reintentar mostramos el mismo
 * resumen "Revisa y confirma" del wizard (con código promocional incluido)
 * antes de volver a llamar a purchase y reabrir ePayco.
 * También hace polling del perfil por si el webhook confirma el pago en background.
 */
@Component({
    selector: 'app-onboarding-payment-pending',
    standalone: true,
    imports: [RouterModule, ButtonModule, DividerModule, SkeletonModule, PurchaseSummary, EpaycoCheckout],
    templateUrl: './onboarding-payment-pending.html'
})
export class OnboardingPaymentPending {
    private router = inject(Router);
    private authService = inject(AuthService);
    private notification = inject(NotificationService);
    private analysisPacksService = inject(AnalysisPacksService);
    private packOfferingsService = inject(PackOfferingsService);
    private onboardingService = inject(OnboardingService);
    private checkoutLoader = inject(EpaycoCheckoutLoader);
    private destroyRef = inject(DestroyRef);

    checkout = viewChild.required<EpaycoCheckout>('checkout');
    /** Resumen de compra (visible solo al reintentar); dueño del código promocional. */
    summaryCmp = viewChild<PurchaseSummary>('summary');

    /** Pack pendiente de pago (lo que el usuario intentaba comprar). */
    pendingPack = signal<AnalysisPack | null>(null);
    /** True mientras cargamos el pack pendiente. */
    loadingPack = signal(true);
    /** True mientras se consulta el estado del pago (deshabilita "verificar"). */
    checking = signal(false);
    /** True mientras cargamos los datos del resumen para reintentar. */
    retrying = signal(false);
    /** True mientras se vuelve a llamar a purchase desde el resumen. */
    purchasing = signal(false);
    /** sessionId de ePayco devuelto al reintentar; alimenta el checkout. */
    sessionId = signal<string>('');

    /** True cuando se muestra el resumen "Revisa y confirma" en lugar de la pantalla de espera. */
    showSummary = signal(false);
    /** Onboarding registrado (perfil/empresa/billing) para las tarjetas del resumen. */
    onboarding = signal<OnboardingByProfile | null>(null);
    /** Oferta del catálogo correspondiente al pack pendiente; alimenta el desglose. */
    offering = signal<PackOffering | null>(null);

    private timer: ReturnType<typeof setInterval> | null = null;

    private profile = computed(() => this.authService.currentProfile());

    /** Resúmenes aplanados para las tarjetas del resumen de compra. */
    summaries = computed(() => {
        const o = this.onboarding();
        return o ? onboardingSummaries(o) : null;
    });

    userEmail = computed(() => this.profile()?.email ?? '');

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

    /**
     * Carga los datos del resumen (onboarding registrado + oferta del catálogo)
     * y muestra la pantalla "Revisa y confirma" del paso 4 del wizard, para que
     * el usuario pueda aplicar un código promocional antes de reintentar el pago.
     */
    retryPayment(): void {
        const pack = this.pendingPack();
        const profileId = this.profile()?.id;
        if (!pack || !profileId || this.retrying()) return;

        this.retrying.set(true);
        forkJoin({
            onboarding: this.onboardingService.getOnboardingByProfile(profileId),
            offering: this.packOfferingsService.getPackCatalog().pipe(
                map((catalog) => catalog.find((o) => o.id === pack.packOfferingId) ?? null)
            )
        }).pipe(
            finalize(() => this.retrying.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: ({ onboarding, offering }) => {
                if (!offering) {
                    this.notification.error('El paquete que estabas comprando ya no está disponible. Contacta a soporte.');
                    return;
                }
                this.onboarding.set(onboarding);
                this.offering.set(offering);
                this.showSummary.set(true);
            },
            error: () => {
                this.notification.error('No se pudo cargar el resumen de tu compra. Inténtalo de nuevo o contacta a soporte.');
            }
        });
    }

    /** Vuelve de "Revisa y confirma" a la pantalla de espera del pago. */
    backToPending(): void {
        this.showSummary.set(false);
    }

    /**
     * Vuelve a llamar a purchase para el mismo pack (con el código promocional
     * aplicado en el resumen, si hay) y reabre el checkout de ePayco.
     */
    async goToPayment(): Promise<void> {
        const offering = this.offering();
        if (!offering || this.purchasing()) return;

        this.purchasing.set(true);
        try {
            // El backend revalida y canjea el código al confirmarse el pago.
            const promoCode = this.summaryCmp()?.appliedPromo()?.code;
            const res = await firstValueFrom(
                this.analysisPacksService.purchasePack({ packOfferingId: offering.id, ...(promoCode && { promoCode }) })
            );
            // Si la compra quedó sin costo (código del 100%), no hay pasarela que
            // reabrir: la bolsa ya está activa, basta con verificar el estado.
            if (!res.requiresPayment || !res.sessionId) {
                await this.checkStatus();
                return;
            }
            this.sessionId.set(res.sessionId);
            // Pasamos el id directo: el input aún no se propagó en este tick.
            await this.checkout().open(res.sessionId);
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 400) {
                // Motivo de negocio del backend (código agotado, monto por
                // debajo del mínimo de la pasarela...): se muestra tal cual.
                this.notification.error(error.error?.message ?? 'No se pudo reabrir el pago.');
            } else {
                this.notification.error('No se pudo reabrir el pago. Inténtalo de nuevo o contacta a soporte.');
            }
        } finally {
            this.purchasing.set(false);
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
                this.notification.success('¡Tu pago fue confirmado! Bienvenido a Credit-ia.');
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

    formatCurrency = formatCurrency;
}
