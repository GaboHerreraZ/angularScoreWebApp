import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { StepperModule } from 'primeng/stepper';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Notification } from '@/app/shared/components/notification/notification';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { SubscriptionPlansList } from '@/app/shared/components/subscription-plans-list/subscription-plans-list';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AuthService } from '@/app/core/services/auth.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { SubscriptionService } from '../subscription.service';
import { Parameter } from '@/app/types/parameter';
import { PlanItem, PublicPlansResponse } from '@/app/types/subscription';
import { cardNumberValidator, cardExpiryValidator, cvcValidator, detectCardType, formatCardNumber, getCardBrand, CardType } from '@/app/shared/validators/card.validators';

@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [
        DecimalPipe,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        SelectModule,
        FloatLabelModule,
        FluidModule,
        StepperModule,
        SkeletonModule,
        DividerModule,
        TagModule,
        MessageModule,
        PasswordModule,
        InputMaskModule,
        ProgressSpinnerModule,
        Notification,
        PhoneInput,
        StateControl,
        CityControl,
        SubscriptionPlansList
    ],
    templateUrl: './onboarding.html'
})
export class Onboarding {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private authService = inject(AuthService);
    private supabaseService = inject(SupabaseService);
    private parameterService = inject(ParameterService);
    private subscriptionService = inject(SubscriptionService);
    private notificationService = inject(NotificationService);

    // State
    loadingProfile = signal(false);
    profileLoaded = signal(false);
    activeStep = signal(1);
    registering = signal(false);
    googleLoading = signal(false);
    pendingEmailConfirmation = signal(false);
    savingProfileAndCompany = signal(false);
    processing = signal(false);
    tokenizing = signal(false);
    selectedPlanId = signal<string | null>(null);
    selectedPlan = signal<PlanItem | null>(null);
    errorMessage = signal<string | null>(null);
    subscriptionComplete = signal(false);
    cardType = signal<CardType>('unknown');
    cardBrand = computed(() => getCardBrand(this.cardType()));

    // Auth state
    isAuthenticated = this.supabaseService.isAuthenticated;
    user = computed(() => this.supabaseService.currentUser());

    // Resources
    rolesResource = resource<Parameter[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('rol'))
    });

    adminRole = computed(() => {
        const roles = this.rolesResource.value() ?? [];
        return roles.find(r => r.code === 'administrator') ?? null;
    });

    sectorsResource = resource<Parameter[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('sector'))
    });

    identificationTypesResource = resource<Parameter[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('identification_type'))
    });

    plansResource = resource<PublicPlansResponse, {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.subscriptionService.getPublicPlans())
    });

    step2Loading = computed(() =>
        this.sectorsResource.isLoading() || this.identificationTypesResource.isLoading() || this.savingProfileAndCompany()
    );

    campaign = computed(() => this.plansResource.value()?.campaign ?? null);
    plans = computed(() => this.plansResource.value()?.data ?? []);

    // Step 1 - Register form
    registerForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
        confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: this.passwordMatchValidator });

    // Step 2 - Profile form
    profileForm = new FormGroup({
        email: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        phone: new FormControl('', { nonNullable: true }),
        position: new FormControl<string | null>(null),
        identificationType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    // Step 2 - Company form
    selectedDepartmentId = signal<number | null>(null);

    companyForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nit: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        sectorId: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        state: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        city: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        address: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    // Step 4 - Billing form
    billingDepartmentId = signal<number | null>(null);

    billingForm = new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        docType: new FormControl<Parameter | null>(null, { validators: [Validators.required] }),
        docNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        state: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        city: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    });

    // Step 4 - Card form
    cardForm = new FormGroup({
        cardNumber: new FormControl('', { nonNullable: true, validators: [Validators.required, cardNumberValidator] }),
        cardName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        cvc: new FormControl('', { nonNullable: true, validators: [Validators.required, cvcValidator(() => this.cardType())] }),
        expMonth: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        expYear: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    }, { validators: cardExpiryValidator });

    constructor() {
        // Track company state selection
        this.companyForm.controls.state.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.selectedDepartmentId.set(state?.id ?? null);
            this.companyForm.controls.city.reset();
        });

        // Track billing state selection
        this.billingForm.controls.state.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.billingDepartmentId.set(state?.id ?? null);
            this.billingForm.controls.city.reset();
        });

        // Track card number for type detection
        this.cardForm.controls.cardNumber.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(value => {
            this.cardType.set(detectCardType(value ?? ''));
        });

        // Determine initial step based on auth and profile state (runs only once on init)
        effect(() => {
            // Skip if subscription flow is in progress or complete
            if (this.subscriptionComplete() || this.tokenizing()) return;

            const isAuth = this.isAuthenticated();
            if (!isAuth) {
                this.activeStep.set(1);
                return;
            }

            // Pre-fill email in profile form
            const user = this.user();
            if (user?.email) {
                this.profileForm.controls.email.setValue(user.email);
            }

            // Load profile once if not loaded yet
            if (!this.authService.currentProfile() && user?.id && !this.loadingProfile() && !this.profileLoaded()) {
                this.loadingProfile.set(true);
                this.authService.loadProfile(user.id as string).then(() => {
                    this.loadingProfile.set(false);
                    this.profileLoaded.set(true);
                });
                return;
            }

            // Wait until profile loading finishes
            if (this.loadingProfile()) return;

            const profile = this.authService.currentProfile();
            if (!profile) {
                // Profile doesn't exist yet (new user), go to step 2
                this.activeStep.set(2);
                return;
            }

            if (!profile.userCompanies?.length) {
                this.activeStep.set(2);
                return;
            }

            const company = profile.userCompanies[0];
            if (!company?.company?.companySubscriptions?.length) {
                const savedPlanId = sessionStorage.getItem('onboarding_plan_id');
                if (savedPlanId) {
                    this.selectedPlanId.set(savedPlanId);
                }
                this.activeStep.set(3);
                return;
            }

            const hasActiveSubscription = company.company.companySubscriptions.some(
                sub => sub.isCurrent && sub.status?.code === 'active'
            );

            if (hasActiveSubscription) {
                this.router.navigate(['/app']);
            } else {
                this.activeStep.set(3);
            }
        });
    }

    // ==================== Step 1: Account Creation ====================

    async onRegister(): Promise<void> {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.registering.set(true);
        this.errorMessage.set(null);

        const { email, password } = this.registerForm.getRawValue();
        const { error } = await this.supabaseService.signUp(email, password);

        this.registering.set(false);

        if (error) {
            const msg = error.message?.toLowerCase() ?? '';
            if (msg.includes('already registered')) {
                this.errorMessage.set('Este correo electrónico ya está registrado.');
            } else {
                this.errorMessage.set('Error al crear la cuenta. Intenta de nuevo.');
            }
            return;
        }

        this.pendingEmailConfirmation.set(true);
    }

    async onSignInWithGoogle(): Promise<void> {
        this.googleLoading.set(true);
        this.errorMessage.set(null);

        const redirectTo = window.location.origin + '/auth/callback';
        const { error } = await this.supabaseService.signInWithGoogle(undefined, undefined, redirectTo);

        if (error) {
            this.googleLoading.set(false);
            this.errorMessage.set('Error al iniciar sesión con Google. Intenta de nuevo.');
        }
    }

    // ==================== Step 2: Profile & Company ====================

    async onSaveProfileAndCompany(): Promise<void> {
        if (this.profileForm.invalid || this.companyForm.invalid) {
            this.profileForm.markAllAsTouched();
            this.companyForm.markAllAsTouched();
            return;
        }

        this.savingProfileAndCompany.set(true);

        try {
            const profileData = this.profileForm.getRawValue();
            const companyData = this.companyForm.getRawValue();

            await firstValueFrom(this.subscriptionService.setupOnboarding({
                profile: {
                    name: profileData.name,
                    lastName: profileData.lastName,
                    email: profileData.email,
                    phone: profileData.phone,
                    position: profileData.position,
                    identificationTypeId: profileData.identificationType!.id,
                    identificationNumber: profileData.identificationNumber,
                },
                company: {
                    name: companyData.name,
                    nit: companyData.nit,
                    sectorId: companyData.sectorId!.id,
                    state: companyData.state!.name,
                    city: companyData.city!.name,
                    address: companyData.address,
                },
            }));

            const user = this.user();
            await this.authService.loadProfile(user!.id as string);

            this.notificationService.success('Información guardada correctamente');
            this.activeStep.set(3);
        } catch {
            this.notificationService.error('Error al guardar la información. Intenta de nuevo.');
        } finally {
            this.savingProfileAndCompany.set(false);
        }
    }

    // ==================== Step 3: Plan Selection ====================

    async onSelectPlan(plan: PlanItem): Promise<void> {
        this.processing.set(true);
        this.selectedPlanId.set(plan.id);

        try {
            const companyId = this.authService.currentProfile()?.userCompanies?.[0]?.companyId;
            if (!companyId) {
                this.notificationService.error('No se encontró la empresa asociada a tu cuenta.');
                return;
            }

            this.selectedPlan.set(plan);

            if (plan.price === 0) {
                await firstValueFrom(
                    this.subscriptionService.subscribeFree(companyId, plan.id)
                );
                await this.authService.loadProfile(this.user()!.id as string);
                this.subscriptionComplete.set(true);
                return;
            } else {
                this.selectedPlan.set(plan);
                sessionStorage.removeItem('onboarding_plan_id');
                this.prefillBillingFromProfile();
                this.activeStep.set(4);
            }
        } catch {
            this.notificationService.error('No se pudo iniciar el proceso. Intenta de nuevo.');
        } finally {
            this.processing.set(false);
        }
    }

    // ==================== Step 4: Billing & Payment ====================

    onCardNumberInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = formatCardNumber(input.value);
        this.cardForm.controls.cardNumber.setValue(formatted, { emitEvent: true });
    }

    async onSubscribe(): Promise<void> {
        if (this.billingForm.invalid || this.cardForm.invalid) {
            this.billingForm.markAllAsTouched();
            this.cardForm.markAllAsTouched();
            return;
        }

        this.tokenizing.set(true);

        try {
            const companyId = this.authService.currentProfile()?.userCompanies?.[0]?.companyId;
            if (!companyId) {
                this.notificationService.error('No se encontró la empresa asociada a tu cuenta.');
                return;
            }

            const cardData = this.cardForm.getRawValue();
            const billingData = this.billingForm.getRawValue();

            await firstValueFrom(
                this.subscriptionService.subscribe(companyId, {
                    subscriptionId: this.selectedPlan()!.id,
                    card: {
                        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
                        cardName: cardData.cardName,
                        cvc: cardData.cvc,
                        expMonth: cardData.expMonth,
                        expYear: cardData.expYear
                    },
                    billing: {
                        name: billingData.name,
                        lastName: billingData.lastName,
                        docType: billingData.docType?.code ?? '',
                        docNumber: billingData.docNumber,
                        email: billingData.email,
                        address: billingData.address,
                        state: billingData.state?.name ?? '',
                        city: billingData.city?.name ?? '',
                        phone: billingData.phone
                    }
                })
            );

            await this.authService.loadProfile(this.user()!.id as string);
            this.subscriptionComplete.set(true);
        } catch {
            this.notificationService.error('Error al procesar el pago. Verifica los datos e intenta de nuevo.');
        } finally {
            this.tokenizing.set(false);
        }
    }

    // ==================== Helpers ====================

    goToDashboard(): void {
        this.router.navigate(['/app']);
    }

    private prefillBillingFromProfile(): void {
        const profile = this.authService.currentProfile();
        if (!profile) return;

        this.billingForm.patchValue({
            name: profile.name ?? '',
            lastName: profile.lastName ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
        });

        // Pre-fill doc type from profile if available
        const idTypes = this.identificationTypesResource.value() ?? [];
        if (profile.identificationTypeId) {
            const docType = idTypes.find(t => t.id === profile.identificationTypeId);
            if (docType) this.billingForm.controls.docType.setValue(docType);
        }

        if (profile.identificationNumber) {
            this.billingForm.controls.docNumber.setValue(profile.identificationNumber);
        }
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    getDiscountedPrice(price: number): number {
        const campaign = this.campaign();
        if (!campaign || price === 0) return price;
        return Math.round(price * (1 - campaign.discount / 100));
    }

    formatCampaignEndDate(): string {
        const campaign = this.campaign();
        if (!campaign) return '';
        return new Date(campaign.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    isInvalid(form: FormGroup, controlName: string): boolean {
        const control = form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(form: FormGroup, controlName: string): string {
        const control = form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        if (control.errors['minlength']) return 'Mínimo 6 caracteres';
        if (control.errors['luhn'] || control.errors['cardNumber']) return 'Número de tarjeta inválido';
        if (control.errors['cvc']) return 'CVC inválido';
        return '';
    }

    getExpiryError(): string {
        if (this.cardForm.errors?.['cardExpiry'] && (this.cardForm.controls.expMonth.touched || this.cardForm.controls.expYear.touched)) {
            return 'Fecha de expiración inválida';
        }
        return '';
    }

    get currentYear(): number {
        return new Date().getFullYear();
    }

    get expiryYears(): string[] {
        const year = this.currentYear;
        return Array.from({ length: 12 }, (_, i) => String(year + i));
    }

    get expiryMonths(): string[] {
        return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    }

    logout(): void {
        this.supabaseService.signOut();
        this.router.navigate(['/']);
    }
}
