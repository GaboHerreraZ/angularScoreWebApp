import { Component, computed, DestroyRef, effect, inject, resource, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuItem } from 'primeng/api';
import { PackDisplayCard } from '@/app/shared/components/pack-card/pack-display-card';
import { PackIncludedFeatures } from '@/app/shared/components/pack-card/pack-included-features';
import { CardCarousel } from '@/app/shared/components/card-carousel/card-carousel';
import { BillingForm } from '@/app/shared/components/billing-form/billing-form';
import { buildBillingForm } from '@/app/shared/components/billing-form/billing-form.builder';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { EpaycoCheckoutLoader } from '@/app/shared/components/epayco-checkout/epayco-checkout.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { WelcomeService } from '@/app/shared/components/welcome-dialog/welcome.service';
import { Parameter } from '@/app/types/parameter';
import { OnboardingService } from '../onboarding.service';
import { PurchaseSummary, onboardingSummaries } from '../purchase-summary/purchase-summary';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { OnboardingByProfile, OnboardingRequest, PackOffering } from '@/app/types/onboarding';
import { PRESELECTED_PACK_KEY } from '@/app/core/constants/storage-keys';

/**
 * Onboarding en 3 pasos: Perfil (mínimo: nombre + cargo + nombre de la empresa),
 * Paquete y facturación, y Resumen. El NIT, sector, ciudad, dirección y
 * representante legal de la empresa NO se piden aquí: se completan después en
 * Administración → Empresa (la app muestra los pendientes y bloquea con aviso
 * las funciones que los necesitan).
 */
@Component({
    selector: 'app-onboarding-wizard',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        StepsModule,
        ButtonModule,
        InputTextModule,
        FloatLabelModule,
        SkeletonModule,
        PackDisplayCard,
        PackIncludedFeatures,
        CardCarousel,
        BillingForm,
        PurchaseSummary,
        EpaycoCheckout
    ],
    templateUrl: './onboarding-wizard.html'
})
export class OnboardingWizard {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private onboardingService = inject(OnboardingService);
    private packOfferingsService = inject(PackOfferingsService);
    private analysisPacksService = inject(AnalysisPacksService);
    private supabaseService = inject(SupabaseService);
    private notification = inject(NotificationService);
    private checkoutLoader = inject(EpaycoCheckoutLoader);
    private welcomeService = inject(WelcomeService);

    checkout = viewChild.required<EpaycoCheckout>('checkout');
    /** Resumen de compra del último paso; dueño del código promocional. Solo existe en ese paso. */
    summary = viewChild<PurchaseSummary>('summary');

    constructor() {
        // Precargamos el script de ePayco al llegar al resumen, para que
        // openNew() ocurra junto al click y el navegador no bloquee el popup.
        effect(() => {
            if (this.step() === 2) {
                this.checkoutLoader.load().catch(() => { /* se reintenta al pagar */ });
            }
        });

        // queueMicrotask: corre tras inicializar todas las propiedades de la clase.
        queueMicrotask(() => this.loadExistingOnboarding());

        // Pack elegido en la página de precios (viaja en sessionStorage): al
        // cargar el catálogo lo preseleccionamos en el paso "Paquete". La clave
        // se borra siempre, incluso si el id ya no existe en el catálogo.
        effect(() => {
            const packs = this.packsResource.value();
            if (!packs) return;
            const packId = sessionStorage.getItem(PRESELECTED_PACK_KEY);
            if (!packId) return;
            sessionStorage.removeItem(PRESELECTED_PACK_KEY);
            const pack = packs.find((p) => p.id === packId);
            if (pack) this.selectedPack.set(pack);
        });
    }

    /**
     * Si el usuario ya completó su registro (GET 200), saltamos directo a elegir
     * el paquete y bloqueamos volver atrás: perfil, empresa y facturación ya
     * están guardados y solo se usan para el resumen del pago. Un 404 significa
     * empezar de cero.
     */
    private loadExistingOnboarding(): void {
        const profileId = this.supabaseService.currentUser()?.id as string | undefined;
        if (!profileId) {
            this.checkingExisting.set(false);
            return;
        }

        this.onboardingService.getOnboardingByProfile(profileId).pipe(
            finalize(() => this.checkingExisting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.existing.set(data);
                this.companyId.set(data.companyId);
                this.prefilled.set(true);
                this.step.set(1); // saltamos a "Paquete y facturación"
            },
            error: () => {
                // 404 (u otro): no hay onboarding previo, se empieza desde el paso 1.
            }
        });
    }

    // ── Estado del asistente ──────────────────────────────────────────
    step = signal(0);

    steps: MenuItem[] = [
        { label: 'Perfil' },
        { label: 'Paquete y facturación' },
        { label: 'Resumen' }
    ];

    /** Frase motivacional que acompaña al usuario en cada paso. */
    stepTagline = computed(() => {
        switch (this.step()) {
            case 0: return 'Empecemos por conocerte. Tomará menos de un minuto.';
            case 1: return 'Elige tu paquete y dinos a nombre de quién facturamos.';
            case 2: return '¡Último paso! Revisa todo y activa tu cuenta.';
            default: return '';
        }
    });

    /** companyId devuelto por POST /onboarding; null hasta que se registra. */
    companyId = signal<string | null>(null);
    /** sessionId de ePayco devuelto por la compra; alimenta el checkout. */
    sessionId = signal<string>('');

    /** True si el usuario ya tenía onboarding (GET 200): se salta a planes sin volver atrás. */
    prefilled = signal(false);
    /** Onboarding existente (perfil/empresa/billing) para mostrar en el resumen. */
    existing = signal<OnboardingByProfile | null>(null);
    /** Mientras verificamos si ya hay onboarding, mostramos un loader. */
    checkingExisting = signal(true);

    submittingOnboarding = signal(false);
    purchasing = signal(false);

    /**
     * El código promocional del resumen cubre el 100%: no habrá pasarela de
     * pago. El estado vive en el componente de resumen (último paso).
     */
    isFreePurchase = computed<boolean>(() => this.summary()?.isFreePurchase() ?? false);

    // ── Catálogos ─────────────────────────────────────────────────────
    packsResource = resource<PackOffering[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.packOfferingsService.getPackCatalog())
    });

    selectedPack = signal<PackOffering | null>(null);

    // ── Formularios ───────────────────────────────────────────────────
    profileForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        position: new FormControl('', { nonNullable: true })
    });

    /** La empresa nace solo con el nombre; el resto se completa dentro de la app. */
    companyForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    /**
     * Código de quien recomendó Creditia. Opcional, pero es el único momento
     * cómodo para capturarlo: después solo puede hacerlo un admin y por pocos días.
     */
    referralForm = new FormGroup({
        salesRepCode: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] })
    });

    /** Datos de facturación (los llena el usuario en el paso de Paquete). */
    billingForm = buildBillingForm();

    /**
     * Siembra la facturación con lo ya escrito en el perfil (solo campos vacíos):
     * el caso común es que quien registra también es el titular de la factura.
     */
    private prefillBillingFromProfile(): void {
        const p = this.profileForm.getRawValue();
        const patch: Record<string, string> = {};
        if (!this.billingForm.get('billingName')?.value) patch['billingName'] = p.name;
        if (!this.billingForm.get('billingLastName')?.value) patch['billingLastName'] = p.lastName;
        if (!this.billingForm.get('billingEmail')?.value && this.userEmail) patch['billingEmail'] = this.userEmail;
        this.billingForm.patchValue(patch);
    }

    // ── Navegación entre pasos ────────────────────────────────────────
    next(): void {
        if (this.step() === 0) {
            if (this.profileForm.invalid || this.companyForm.invalid) {
                this.profileForm.markAllAsTouched();
                this.companyForm.markAllAsTouched();
                return;
            }
            this.prefillBillingFromProfile();
        }
        if (this.step() === 1) {
            if (!this.selectedPack()) {
                this.notification.warn('Selecciona un paquete para continuar.');
                return;
            }
            if (!this.prefilled() && this.billingForm.invalid) {
                this.billingForm.markAllAsTouched();
                return;
            }
            // Al salir del paso, registramos el onboarding si aún no está hecho.
            if (!this.companyId()) {
                this.submitOnboarding();
                return;
            }
        }
        this.step.update((s) => Math.min(s + 1, this.steps.length - 1));
    }

    back(): void {
        this.step.update((s) => Math.max(s - 1, this.stepFloor()));
    }

    /**
     * Paso mínimo al que se puede retroceder. Con el onboarding ya precargado,
     * perfil y facturación no se editan y el mínimo pasa a ser "Paquete".
     */
    stepFloor(): number {
        return this.prefilled() ? 1 : 0;
    }

    /** True si desde el resumen se pueden corregir perfil y facturación. */
    canEdit = computed(() => !this.prefilled());

    /** Vuelve a un paso anterior desde el resumen para corregir datos. */
    editStep(index: number): void {
        if (index < this.stepFloor()) return;
        this.step.set(index);
    }

    onSelectPack(pack: PackOffering): void {
        this.selectedPack.set(pack);
    }

    // ── POST /onboarding ──────────────────────────────────────────────
    private submitOnboarding(): void {
        const payload = this.buildOnboardingPayload();

        this.submittingOnboarding.set(true);
        this.onboardingService.submitOnboarding(payload).pipe(
            finalize(() => this.submittingOnboarding.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (res) => {
                this.companyId.set(res.companyId);
                // Onboarding nuevo → la bienvenida debe volver a mostrarse
                // aunque este usuario ya la haya visto con una cuenta anterior.
                this.welcomeService.reset(res.profileId);
                this.step.set(2);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 409) {
                    this.notification.error(error.error?.message || 'Este correo ya está asociado a otra cuenta.');
                } else {
                    this.notification.error('No se pudo completar el registro. Revisa los datos e inténtalo de nuevo.');
                }
            }
        });
    }

    /** Arma el payload de /onboarding con perfil mínimo, nombre de empresa y facturación. */
    private buildOnboardingPayload(): OnboardingRequest {
        const p = this.profileForm.getRawValue();
        const c = this.companyForm.getRawValue();
        const b = this.billingForm.getRawValue();
        const referralCode = this.referralForm.getRawValue().salesRepCode.trim();
        const position = p.position.trim();

        return {
            ...(referralCode && { salesRepCode: referralCode.toUpperCase() }),
            profile: {
                name: p.name,
                lastName: p.lastName,
                ...(position && { position })
            },
            company: {
                name: c.name
            },
            billing: {
                billingName: b.billingName,
                billingLastName: b.billingLastName,
                billingBusinessName: b.billingBusinessName,
                billingDocTypeId: b.billingDocType!.id,
                billingDocNumber: b.billingDocNumber,
                billingEmail: b.billingEmail,
                billingPhone: b.billingPhone,
                billingAddress: b.billingAddress,
                billingCityCode: b.billingCity?.code ?? '',
                billingRegimeTypeId: b.billingRegimeType!.id,
                billingFiscalResponsibilities: (b.billingFiscalResponsibilities ?? []).map((r: Parameter) => r.code)
            }
        };
    }

    // ── Compra + checkout ─────────────────────────────────────────────
    goToPayment(): void {
        const companyId = this.companyId();
        const pack = this.selectedPack();
        if (!companyId || !pack) return;

        this.purchasing.set(true);
        // Pasamos el companyId explícito: en el onboarding la empresa se acaba de
        // crear y el perfil en memoria aún no lo tiene.
        // El backend revalida y canjea el código al confirmarse el pago.
        const promoCode = this.summary()?.appliedPromo()?.code;
        this.analysisPacksService.purchasePack({ packOfferingId: pack.id, ...(promoCode && { promoCode }) }, companyId).pipe(
            finalize(() => this.purchasing.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (res) => {
                // Compra sin costo (código del 100%): no hay pasarela que abrir,
                // la bolsa ya quedó activa. Vamos a la misma pantalla de resultado
                // que usa el pago, que refresca el perfil y da entrada al panel.
                if (!res.requiresPayment || !res.sessionId) {
                    this.router.navigate(['/pago/resultado'], { queryParams: { ref: res.analysisPackId } });
                    return;
                }
                this.sessionId.set(res.sessionId);
                // Pasamos el id directo: el input aún no se propagó en este tick.
                this.checkout().open(res.sessionId);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 404) {
                    this.notification.error('El paquete seleccionado ya no está disponible.');
                } else if (error.status === 400) {
                    // Motivo de negocio del backend (código agotado, monto por
                    // debajo del mínimo de la pasarela...): se muestra tal cual.
                    this.notification.error(error.error?.message ?? 'No se pudo iniciar el pago.');
                } else {
                    this.notification.error('No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos.');
                }
            }
        });
    }

    onCheckoutError(): void {
        this.notification.error('No se pudo abrir la pasarela de pago. Inténtalo de nuevo.');
    }

    // ── Resumen ───────────────────────────────────────────────────────
    /** Email del usuario autenticado (se muestra en la tarjeta de Perfil). */
    userEmail = (this.supabaseService.currentUser()?.email as string) ?? '';

    /** Resúmenes del onboarding precargado (GET 200); null si el usuario llena los forms. */
    private existingSummaries = computed(() => {
        const e = this.existing();
        return e ? onboardingSummaries(e) : null;
    });

    /**
     * Datos del resumen. Si el onboarding venía precargado (GET 200) usamos esa
     * data; si el usuario lo llenó en los pasos anteriores, lo tomamos de los forms.
     */
    get profileSummary() {
        const ex = this.existingSummaries();
        if (ex) return ex.profile;
        const p = this.profileForm.getRawValue();
        return {
            name: `${p.name} ${p.lastName}`.trim(),
            position: p.position,
            // Ya no se piden en el onboarding; se completan dentro de la app.
            docNumber: '',
            phone: ''
        };
    }

    get companySummary() {
        const ex = this.existingSummaries();
        if (ex) return ex.company;
        return {
            name: this.companyForm.getRawValue().name,
            // NIT, dirección y ciudad se completan dentro de la app.
            nit: '',
            address: '',
            location: ''
        };
    }

    /**
     * Nombre a mostrar en el resumen: la razón social si se factura a una
     * persona jurídica, y si no el nombre completo de la persona natural.
     */
    private billingDisplayName(businessName?: string | null, name?: string | null, lastName?: string | null): string {
        return (businessName ?? '').trim() || `${name ?? ''} ${lastName ?? ''}`.trim();
    }

    get billingSummary() {
        const ex = this.existingSummaries();
        if (ex) return ex.billing;
        const b = this.billingForm.getRawValue();
        return {
            name: this.billingDisplayName(b.billingBusinessName, b.billingName, b.billingLastName),
            docNumber: b.billingDocNumber ?? '',
            email: b.billingEmail ?? '',
            phone: b.billingPhone ?? '',
            address: b.billingAddress ?? '',
            location: [b.billingCity?.name, b.billingState?.name].filter(Boolean).join(', ')
        };
    }
}
