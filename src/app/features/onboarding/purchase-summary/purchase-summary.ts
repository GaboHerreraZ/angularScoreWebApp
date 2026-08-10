import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { formatCurrency } from '@/app/shared/utils/format.util';
import { PackPricing, packPricing } from '@/app/shared/utils/pack-pricing.util';
import {
    OnboardingByProfile,
    PackOffering,
    PromoCodeValidation,
    PurchaseBillingSummary,
    PurchaseCompanySummary,
    PurchaseProfileSummary
} from '@/app/types/onboarding';

/**
 * Nombre a mostrar en facturación: la razón social si se factura a una persona
 * jurídica, y si no el nombre completo de la persona natural.
 */
function billingDisplayName(businessName?: string | null, name?: string | null, lastName?: string | null): string {
    return (businessName ?? '').trim() || `${name ?? ''} ${lastName ?? ''}`.trim();
}

/** Aplana un onboarding ya registrado (GET /onboarding/:profileId) a los resúmenes de las tarjetas. */
export function onboardingSummaries(e: OnboardingByProfile): {
    profile: PurchaseProfileSummary;
    company: PurchaseCompanySummary;
    billing: PurchaseBillingSummary;
} {
    return {
        profile: {
            name: `${e.profile.name} ${e.profile.lastName}`.trim(),
            position: e.profile.position,
            docNumber: e.profile.identificationNumber,
            phone: e.profile.phone
        },
        company: {
            name: e.company.name,
            nit: e.company.nit,
            address: e.company.address,
            location: [e.company.city, e.company.state].filter(Boolean).join(', ')
        },
        billing: {
            name: billingDisplayName(e.billing.billingBusinessName, e.billing.billingName, e.billing.billingLastName),
            docNumber: e.billing.billingDocNumber,
            email: e.billing.billingEmail,
            phone: e.billing.billingPhone,
            address: e.billing.billingAddress,
            location: [e.billing.billingCity, e.billing.billingState].filter(Boolean).join(', ')
        }
    };
}

/**
 * Resumen de compra previo al pago ("Revisa y confirma"): tarjetas de perfil,
 * empresa y facturación, el pack elegido, el código promocional y el desglose
 * del cobro. Lo comparten el paso 4 del wizard de onboarding y la pantalla de
 * pago pendiente (al reintentar el pago).
 *
 * El componente es dueño del estado del código promocional; el padre lee el
 * código aplicado (`appliedPromo`) y `isFreePurchase` vía viewChild al comprar.
 */
@Component({
    selector: 'app-purchase-summary',
    standalone: true,
    imports: [FormsModule, ButtonModule, InputTextModule],
    templateUrl: './purchase-summary.html'
})
export class PurchaseSummary {
    private destroyRef = inject(DestroyRef);
    private analysisPacksService = inject(AnalysisPacksService);

    /** Pack que se va a comprar; alimenta el desglose del cobro. */
    pack = input.required<PackOffering | null>();
    profileSummary = input.required<PurchaseProfileSummary>();
    companySummary = input.required<PurchaseCompanySummary>();
    billingSummary = input.required<PurchaseBillingSummary>();
    /** Email del usuario autenticado (se muestra en la tarjeta de Perfil). */
    userEmail = input<string>('');
    /**
     * companyId explícito para validar el código promocional. En el onboarding
     * la empresa se acaba de crear y el perfil en memoria aún no lo tiene; si
     * se omite, el servicio usa el companyId del perfil.
     */
    companyId = input<string | null>(null);
    /** True si se pueden corregir perfil, empresa y facturación (wizard sin precarga). */
    canEdit = input<boolean>(false);

    /** Índice del paso del wizard a corregir (0 = perfil, 1 = empresa/facturación). */
    edit = output<number>();

    // ── Código promocional ────────────────────────────────────────────
    promoCode = signal<string>('');
    validatingPromo = signal<boolean>(false);
    /** Código aplicado tras una validación exitosa; null si no hay descuento. */
    appliedPromo = signal<PromoCodeValidation | null>(null);
    /** Motivo de rechazo de la última validación; null si no aplica. */
    promoError = signal<string | null>(null);

    /** Porcentaje de descuento del código aplicado (0 si no hay). */
    promoDiscountPercent = computed<number>(() => this.appliedPromo()?.discountPercent ?? 0);

    /**
     * Desglose del cobro del pack elegido (descuentos + IVA), recalculado con el
     * código promocional aplicado igual que lo hace el backend.
     */
    pricing = computed<PackPricing>(() => packPricing(this.pack(), this.promoDiscountPercent()));

    /** Pesos que descuenta el código, para mostrarlo como línea del desglose. */
    promoDiscountAmount = computed<number>(() => this.pricing().promoDiscount);

    /**
     * El código cubre el 100%: no habrá pasarela de pago. El backend entrega la
     * bolsa activa de una y no se factura nada.
     */
    isFreePurchase = computed<boolean>(() => !!this.appliedPromo() && this.pricing().totalToCharge <= 0);

    /** Quita el código aplicado y limpia el error, para volver a intentar con otro. */
    clearPromo(): void {
        this.promoCode.set('');
        this.appliedPromo.set(null);
        this.promoError.set(null);
    }

    /**
     * Valida el código promocional contra el backend para previsualizar el descuento.
     * No canjea el código: eso ocurre al confirmar el pago.
     */
    validatePromoCode(): void {
        const code = this.promoCode().trim();
        if (!code || this.validatingPromo()) return;

        this.validatingPromo.set(true);
        this.appliedPromo.set(null);
        this.promoError.set(null);
        this.analysisPacksService.validatePromoCode(code, this.companyId() ?? undefined).pipe(
            finalize(() => this.validatingPromo.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (result) => {
                if (result.valid) {
                    this.appliedPromo.set(result);
                } else {
                    this.promoError.set(result.reason ?? 'El código no es válido.');
                }
            },
            error: () => {
                this.promoError.set('No se pudo validar el código. Inténtalo de nuevo.');
            }
        });
    }

    formatCurrency = formatCurrency;
}
