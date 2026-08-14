import { Component, computed, DestroyRef, effect, inject, resource, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuItem } from 'primeng/api';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { SectorSelect } from '@/app/shared/components/sector-select/sector-select';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { PackDisplayCard } from '@/app/shared/components/pack-card/pack-display-card';
import { PackIncludedFeatures } from '@/app/shared/components/pack-card/pack-included-features';
import { CardCarousel } from '@/app/shared/components/card-carousel/card-carousel';
import { BillingForm } from '@/app/shared/components/billing-form/billing-form';
import { buildBillingForm } from '@/app/shared/components/billing-form/billing-form.builder';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { EpaycoCheckoutLoader } from '@/app/shared/components/epayco-checkout/epayco-checkout.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Parameter } from '@/app/types/parameter';
import { OnboardingService } from '../onboarding.service';
import { PurchaseSummary, onboardingSummaries } from '../purchase-summary/purchase-summary';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { OnboardingByProfile, OnboardingRequest, PackOffering } from '@/app/types/onboarding';
import { PRESELECTED_PACK_KEY } from '@/app/core/constants/storage-keys';

import type { LocationOption as StateCity } from '@/app/core/services/locations.service';

@Component({
    selector: 'app-onboarding-wizard',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        StepsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        FloatLabelModule,
        SkeletonModule,
        PhoneInput,
        SectorSelect,
        StateControl,
        CityControl,
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
    private parameterService = inject(ParameterService);
    private supabaseService = inject(SupabaseService);
    private notification = inject(NotificationService);
    private checkoutLoader = inject(EpaycoCheckoutLoader);

    checkout = viewChild.required<EpaycoCheckout>('checkout');
    /** Resumen de compra del paso 4; dueño del código promocional. Solo existe en ese paso. */
    summary = viewChild<PurchaseSummary>('summary');

    constructor() {
        // Precargamos el script de ePayco al llegar al resumen, para que
        // openNew() ocurra junto al click y el navegador no bloquee el popup.
        effect(() => {
            if (this.step() === 3) {
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
     * Si el usuario ya completó perfil + empresa (GET 200), saltamos directo a
     * elegir el paquete y bloqueamos volver atrás: esos datos ya están guardados
     * y solo se usan para el resumen del pago. Un 404 significa empezar de cero.
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
                this.step.set(2); // saltamos a "Paquete"
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
        { label: 'Empresa' },
        { label: 'Paquete' },
        { label: 'Resumen' }
    ];

    /** Frase motivacional que acompaña al usuario en cada paso. */
    stepTagline = computed(() => {
        switch (this.step()) {
            case 0: return 'Empecemos por conocerte. Tomará menos de un minuto.';
            case 1: return 'Vas muy bien. Cuéntanos de tu empresa.';
            case 2: return 'Ya casi. Elige el paquete que mejor se ajusta a ti.';
            case 3: return '¡Último paso! Revisa todo y activa tu cuenta.';
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
     * pago. El estado vive en el componente de resumen (paso 4).
     */
    isFreePurchase = computed<boolean>(() => this.summary()?.isFreePurchase() ?? false);

    // ── Catálogos ─────────────────────────────────────────────────────
    identificationTypesResource = resource<Parameter[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('identification_type'))
    });

    packsResource = resource<PackOffering[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.packOfferingsService.getPackCatalog())
    });

    selectedPack = signal<PackOffering | null>(null);

    // ── Formularios ───────────────────────────────────────────────────
    profileForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        identificationType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        position: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    companyForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nit: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        sector: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        state: new FormControl<StateCity | null>(null, { validators: [Validators.required] }),
        city: new FormControl<StateCity | null>(null, { validators: [Validators.required] }),
        address: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    /** Datos de facturación (los llena el usuario en el paso de Empresa). */
    billingForm = buildBillingForm();

    /**
     * Id del departamento seleccionado en la empresa. Un computed no basta:
     * un FormControl no es un signal, así que escuchamos sus cambios de valor
     * para que el control de ciudad se habilite al elegir departamento.
     */
    private companyState = toSignal(this.companyForm.controls.state.valueChanges, {
        initialValue: this.companyForm.controls.state.value
    });
    regionCode = computed(() => this.companyState()?.code ?? null);

    // ── Navegación entre pasos ────────────────────────────────────────
    next(): void {
        if (this.step() === 0 && this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }
        if (this.step() === 1) {
            if (this.companyForm.invalid || this.billingForm.invalid) {
                this.companyForm.markAllAsTouched();
                this.billingForm.markAllAsTouched();
                return;
            }
            // Al salir de "Empresa", registramos onboarding si aún no está hecho.
            if (!this.companyId()) {
                this.submitOnboarding();
                return;
            }
        }
        if (this.step() === 2 && !this.selectedPack()) {
            this.notification.warn('Selecciona un paquete para continuar.');
            return;
        }
        this.step.update((s) => Math.min(s + 1, this.steps.length - 1));
    }

    back(): void {
        this.step.update((s) => Math.max(s - 1, this.stepFloor()));
    }

    /**
     * Paso mínimo al que se puede retroceder. Con el onboarding ya precargado,
     * perfil y empresa no se editan y el mínimo pasa a ser "Paquete".
     */
    private stepFloor(): number {
        return this.prefilled() ? 2 : 0;
    }

    /** True si desde el resumen se pueden corregir perfil, empresa y facturación. */
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
                this.step.set(2);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 409) {
                    this.notification.error(error.error?.message || 'Ya existe una empresa con ese NIT.');
                } else {
                    this.notification.error('No se pudo completar el registro. Revisa los datos e inténtalo de nuevo.');
                }
            }
        });
    }

    /** Arma el payload de /onboarding con perfil, empresa y los datos de facturación del form. */
    private buildOnboardingPayload(): OnboardingRequest {
        const p = this.profileForm.getRawValue();
        const c = this.companyForm.getRawValue();
        const b = this.billingForm.getRawValue();

        return {
            profile: {
                name: p.name,
                lastName: p.lastName,
                phone: p.phone,
                identificationTypeId: p.identificationType!.id,
                identificationNumber: p.identificationNumber,
                position: p.position
            },
            company: {
                name: c.name,
                nit: c.nit,
                sectorId: c.sector!.id,
                cityCode: c.city!.code,
                address: c.address
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
     * data; si el usuario lo llenó en los pasos 1-2, lo tomamos de los forms.
     */
    get profileSummary() {
        const ex = this.existingSummaries();
        if (ex) return ex.profile;
        const p = this.profileForm.getRawValue();
        return {
            name: `${p.name} ${p.lastName}`.trim(),
            position: p.position,
            docNumber: p.identificationNumber,
            phone: p.phone
        };
    }

    get companySummary() {
        const ex = this.existingSummaries();
        if (ex) return ex.company;
        const c = this.companyForm.getRawValue();
        return {
            name: c.name,
            nit: c.nit,
            address: c.address,
            location: [c.city?.name, c.state?.name].filter(Boolean).join(', ')
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
