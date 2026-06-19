import { Component, computed, DestroyRef, effect, inject, resource, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { MenuItem } from 'primeng/api';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { SectorSelect } from '@/app/shared/components/sector-select/sector-select';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { PackCard } from '@/app/shared/components/pack-card/pack-card';
import { BillingForm } from '@/app/shared/components/billing-form/billing-form';
import { buildBillingForm } from '@/app/shared/components/billing-form/billing-form.builder';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { EpaycoCheckoutLoader } from '@/app/shared/components/epayco-checkout/epayco-checkout.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { Parameter } from '@/app/types/parameter';
import { OnboardingService } from '../onboarding.service';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { OnboardingByProfile, OnboardingRequest, PackOffering } from '@/app/types/onboarding';

type StateCity = { id: number; name: string };

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
        DividerModule,
        PhoneInput,
        SectorSelect,
        StateControl,
        CityControl,
        PackCard,
        BillingForm,
        EpaycoCheckout
    ],
    templateUrl: './onboarding-wizard.html'
})
export class OnboardingWizard {
    private destroyRef = inject(DestroyRef);
    private onboardingService = inject(OnboardingService);
    private packOfferingsService = inject(PackOfferingsService);
    private analysisPacksService = inject(AnalysisPacksService);
    private parameterService = inject(ParameterService);
    private supabaseService = inject(SupabaseService);
    private notification = inject(NotificationService);
    private checkoutLoader = inject(EpaycoCheckoutLoader);

    checkout = viewChild.required<EpaycoCheckout>('checkout');

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
    departmentId = computed(() => this.companyState()?.id ?? null);

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
        // Con onboarding precargado, perfil y empresa no se editan: el mínimo es "Paquete".
        const floor = this.prefilled() ? 2 : 0;
        this.step.update((s) => Math.max(s - 1, floor));
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
                state: c.state!.name,
                city: c.city!.name,
                address: c.address
            },
            billing: {
                billingName: b.billingName,
                billingLastName: b.billingLastName,
                billingDocTypeId: b.billingDocType!.id,
                billingDocNumber: b.billingDocNumber,
                billingEmail: b.billingEmail,
                billingPhone: b.billingPhone,
                billingAddress: b.billingAddress,
                billingState: b.billingState?.name ?? '',
                billingCity: b.billingCity?.name ?? ''
            }
        };
    }

    // ── Compra + checkout ─────────────────────────────────────────────
    goToPayment(): void {
        const companyId = this.companyId();
        const pack = this.selectedPack();
        if (!companyId || !pack) return;

        this.purchasing.set(true);
        this.analysisPacksService.purchasePack({ packOfferingId: pack.id }).pipe(
            finalize(() => this.purchasing.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (res) => {
                this.sessionId.set(res.sessionId);
                // Pasamos el id directo: el input aún no se propagó en este tick.
                this.checkout().open(res.sessionId);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 404) {
                    this.notification.error('El paquete seleccionado ya no está disponible.');
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

    /**
     * Datos del resumen. Si el onboarding venía precargado (GET 200) usamos esa
     * data; si el usuario lo llenó en los pasos 1-2, lo tomamos de los forms.
     */
    get profileSummary() {
        const e = this.existing();
        if (e) {
            return {
                name: `${e.profile.name} ${e.profile.lastName}`.trim(),
                position: e.profile.position,
                docNumber: e.profile.identificationNumber,
                phone: e.profile.phone
            };
        }
        const p = this.profileForm.getRawValue();
        return {
            name: `${p.name} ${p.lastName}`.trim(),
            position: p.position,
            docNumber: p.identificationNumber,
            phone: p.phone
        };
    }

    get companySummary() {
        const e = this.existing();
        if (e) {
            return {
                name: e.company.name,
                nit: e.company.nit,
                address: e.company.address,
                location: [e.company.city, e.company.state].filter(Boolean).join(', ')
            };
        }
        const c = this.companyForm.getRawValue();
        return {
            name: c.name,
            nit: c.nit,
            address: c.address,
            location: [c.city?.name, c.state?.name].filter(Boolean).join(', ')
        };
    }

    get billingSummary() {
        const e = this.existing();
        if (e) {
            return {
                name: `${e.billing.billingName} ${e.billing.billingLastName}`.trim(),
                docNumber: e.billing.billingDocNumber,
                email: e.billing.billingEmail,
                phone: e.billing.billingPhone,
                address: e.billing.billingAddress,
                location: [e.billing.billingCity, e.billing.billingState].filter(Boolean).join(', ')
            };
        }
        const b = this.billingForm.getRawValue();
        return {
            name: `${b.billingName ?? ''} ${b.billingLastName ?? ''}`.trim(),
            docNumber: b.billingDocNumber ?? '',
            email: b.billingEmail ?? '',
            phone: b.billingPhone ?? '',
            address: b.billingAddress ?? '',
            location: [b.billingCity?.name, b.billingState?.name].filter(Boolean).join(', ')
        };
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
