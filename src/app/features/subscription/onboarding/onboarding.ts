import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, finalize } from 'rxjs';
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
import { Notification } from '@/app/shared/components/notification/notification';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AuthService } from '@/app/core/services/auth.service';
import { SupabaseService } from '@/app/core/services/supabase.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { ProfileService } from '@/app/features/administration/components/profile/profile.service';
import { CompanyService } from '@/app/features/administration/components/company/company.service';
import { SubscriptionService } from '../subscription.service';
import { WompiService } from '../wompi.service';
import { Parameter } from '@/app/types/parameter';
import { PlanItem } from '@/app/types/subscription';

@Component({
    selector: 'app-onboarding',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
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
        Notification,
        PhoneInput,
        StateControl,
        CityControl
    ],
    templateUrl: './onboarding.html'
})
export class Onboarding {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private authService = inject(AuthService);
    private supabaseService = inject(SupabaseService);
    private parameterService = inject(ParameterService);
    private profileService = inject(ProfileService);
    private companyService = inject(CompanyService);
    private subscriptionService = inject(SubscriptionService);
    private wompiService = inject(WompiService);
    private notificationService = inject(NotificationService);

    user = this.supabaseService.currentUser();

    activeStep = signal(1);
    savingProfile = signal(false);
    savingCompany = signal(false);
    processing = signal(false);
    selectedPlanId = signal<string | null>(null);
    billingCycle = signal<'monthly' | 'annual'>('monthly');

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

    plansResource = resource<PlanItem[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.subscriptionService.getPublicPlans())
    });

    plans = computed(() => {
        const all = this.plansResource.value() ?? [];
        const isMonthly = this.billingCycle() === 'monthly';
        return all.filter(p => p.isMonthly === isMonthly);
    });

    hasAnnualPlans = computed(() => {
        const all = this.plansResource.value() ?? [];
        return all.some(p => !p.isMonthly);
    });

    profileForm = new FormGroup({
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        phone: new FormControl({ value: this.user?.phoneFormatted, disabled: true }, { nonNullable: true }),
        roleLabel: new FormControl({ value: '', disabled: true }),
        position: new FormControl<string | null>(null)
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

    constructor() {
        // Auto-set admin role label when loaded
        effect(() => {
            const role = this.adminRole();
            if (role) {
                this.profileForm.patchValue({ roleLabel: role.label });
            }
        });

        // Track state selection to update city options
        this.companyForm.controls.state.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.selectedDepartmentId.set(state?.id ?? null);
            this.companyForm.controls.city.reset();
        });

        // Determine initial step based on existing data
        effect(() => {
            const profile = this.authService.currentProfile();
            if (profile) {
                if (!profile.userCompanies?.length) {
                    this.activeStep.set(2);
                    return;
                }

                const company = profile?.userCompanies[0];

                if (!company?.company?.companySubscriptions.length) {
                    this.activeStep.set(3);
                    return;
                }

                const hasActiveSubscription = company.company.companySubscriptions.some(
                    sub => sub.isCurrent && sub.status?.code === 'activa'
                );

                if (hasActiveSubscription) {
                    this.router.navigate(['/']);
                } else {
                    this.activeStep.set(3);
                }

            } else {
                this.activeStep.set(1);
            }
        });
    }

    onSaveProfile(activateCallback: (step: number) => void): void {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        const adminRole = this.adminRole();
        if (!adminRole) {
            this.notificationService.error('No se pudo obtener el rol de administrador.');
            return;
        }

        this.savingProfile.set(true);
        const formData = this.profileForm.getRawValue();
        const payload = {
            id: this.user?.id,
            email: formData.email,
            name: formData.name,
            lastName: formData.lastName,
            phone: this.user?.phone,
            roleId: adminRole.id,
            position: formData.position
        };

        this.profileService.createProfile(payload as any).pipe(
            finalize(() => this.savingProfile.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: async () => {
                this.notificationService.success('Perfil creado correctamente');
                await this.authService.loadProfile(this.user!.id as string);
                activateCallback(2);
            },
            error: () => {
                this.notificationService.error('Error al crear el perfil. Intenta de nuevo.');
            }
        });
    }

    // Step 2: Save company
    onSaveCompany(activateCallback: (step: number) => void): void {
        if (this.companyForm.invalid) {
            this.companyForm.markAllAsTouched();
            return;
        }

        this.savingCompany.set(true);
        const formData = this.companyForm.getRawValue();

        const adminRole = this.adminRole();
        if (!adminRole) {
            this.notificationService.error('No se pudo obtener el rol de administrador.');
            return;
        }

        const payload = {
            name: formData.name,
            nit: formData.nit,
            sectorId: formData.sectorId?.id,
            state: formData.state?.name,
            city: formData.city?.name,
            address: formData.address,
            isActive: true,
            roleId: adminRole.id,
        };

        this.companyService.createCompany(payload as any).pipe(
            finalize(() => this.savingCompany.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: async () => {
                this.notificationService.success('Empresa creada correctamente');
                await this.authService.loadProfile(this.user!.id as string);
                activateCallback(3);
            },
            error: () => {
                this.notificationService.error('Error al crear la empresa. Intenta de nuevo.');
            }
        });
    }

    async onSelectPlan(plan: PlanItem): Promise<void> {
        this.processing.set(true);
        this.selectedPlanId.set(plan.id);

        try {
            const companyId = this.authService.currentProfile()?.userCompanies?.[0]?.companyId;
            if (!companyId) {
                this.notificationService.error('No se encontró la empresa asociada a tu cuenta.');
                return;
            }

            const transaction = await firstValueFrom(
                this.subscriptionService.createTransaction(companyId, { subscriptionId: plan.id })
            );

            if (plan.price === 0) {
                await this.authService.loadProfile(this.user!.id as string);
                this.router.navigate(['/']);
            } else {
                this.wompiService.openCheckout(transaction);
            }
        } catch {
            this.notificationService.error('No se pudo iniciar el proceso. Intenta de nuevo.');
        } finally {
            this.processing.set(false);
            this.selectedPlanId.set(null);
        }
    }

    supportLevelLabel(level: string): string {
        const labels: Record<string, string> = {
            email: 'Correo electrónico',
            priority_email: 'Prioritario',
            dedicated: 'Dedicado'
        };
        return labels[level] ?? level;
    }

    dashboardLevelLabel(level: string): string {
        const labels: Record<string, string> = {
            basic: 'Básico',
            advanced: 'Avanzado',
            full: 'Completo'
        };
        return labels[level] ?? level;
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
        return '';
    }

    logout(): void {
        this.supabaseService.signOut();
        this.router.navigate(['/auth/iniciar-sesion']);
    }
}
