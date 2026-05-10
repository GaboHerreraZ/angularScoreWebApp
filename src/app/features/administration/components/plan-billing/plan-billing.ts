import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '../company/company.service';
import { AuthService } from '@/app/core/services/auth.service';
import { ChangePlanRequest, PlanItem, SubscriptionDetails } from '@/app/types/subscription';
import { Company as CompanyModel } from '@/app/types/company';
import { Parameter } from '@/app/types/parameter';
import { SubscriptionPlansList } from '@/app/shared/components/subscription-plans-list/subscription-plans-list';
import { CustomTable } from '@/app/shared/components/table/table';
import { CardForm } from '@/app/shared/components/card-form/card-form';
import { buildCardForm } from '@/app/shared/components/card-form/card-form.builder';
import { BillingForm } from '@/app/shared/components/billing-form/billing-form';
import { buildBillingForm } from '@/app/shared/components/billing-form/billing-form.builder';
import { ParameterService } from '@/app/core/services/parameter.service';
import { detectCardType, getCardBrand } from '@/app/shared/validators/card.validators';
import { TableSettings } from '@/app/types/table';

@Component({
    selector: 'app-plan-billing',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
        FormsModule,
        ButtonModule,
        CardModule,
        TagModule,
        ProgressBarModule,
        SkeletonModule,
        TooltipModule,
        DialogModule,
        CheckboxModule,
        SubscriptionPlansList,
        CustomTable,
        CardForm,
        BillingForm
    ],
    templateUrl: './plan-billing.html'
})
export class PlanBilling {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);
    private parameterService = inject(ParameterService);

    private companyId = computed(() => {
        const profile = this.authService.currentProfile();
        return profile?.companyId ?? null;
    });

    detailsResource = resource<SubscriptionDetails, string>({
        params: () => this.companyId() as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getSubscriptionDetails(companyId))
    });

    availablePlans = computed(() => this.detailsResource.value()?.availablePlans?.plans ?? []);
    subscriptionUsage = computed(() => this.detailsResource.value()?.subscriptionUsage ?? null);
    paymentHistory = computed(() => {
        const history = this.detailsResource.value()?.paymentHistory ?? [];
        return history.map(p => ({
            id: p.id,
            periodStart: new Date(p.periodStart).toLocaleDateString('es-CO'),
            periodEnd: new Date(p.periodEnd).toLocaleDateString('es-CO'),
            amount: new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(p.amount) + ' ' + p.currencyCode,
            epaycoRef: p.epaycoRef ?? '-',
            franchise: p.franchise ?? '-',
            responseMessage: p.responseMessage,
            statusLabel: p.responseCode === 1 ? 'Aprobado' : 'Rechazado',
            createdAt: new Date(p.createdAt).toLocaleDateString('es-CO')
        }));
    });

    paymentHistoryTableSettings: TableSettings = {
        title: 'Historial de Pagos',
        titleIcon: 'pi pi-history',
        columns: [
            { header: 'Inicio', field: 'periodStart', type: 'text', filterable: false },
            { header: 'Fin', field: 'periodEnd', type: 'text', filterable: false },
            { header: 'Monto', field: 'amount', type: 'text', filterable: false },
            { header: 'Referencia', field: 'epaycoRef', type: 'text' },
            { header: 'Franquicia', field: 'franchise', type: 'text' },
            { header: 'Mensaje', field: 'responseMessage', type: 'text' },
            { header: 'Estado', field: 'statusLabel', type: 'status', severityMap: { 'Aprobado': 'success', 'Rechazado': 'danger' }, defaultSeverity: 'info' },
            { header: 'Fecha', field: 'createdAt', type: 'text', filterable: false }
        ],
        rows: 10,
        rowsPerPageOptions: [5, 10, 20],
        showGridlines: false,
        showSearch: false,
        showColumnFilters: false
    };

    ctaLabelFn = (plan: PlanItem): string => (plan.isCurrent ? 'Plan actual' : 'Cambiar a este plan');
    ctaDisabledFn = (plan: PlanItem): boolean => !!plan.isCurrent;

    usagePercentage(used: number, max: number): number {
        if (max === 0) return 0;
        return Math.round((used / max) * 100);
    }

    usageSeverity(used: number, max: number): string {
        const pct = this.usagePercentage(used, max);
        if (pct >= 90) return 'danger';
        if (pct >= 70) return 'warn';
        return 'success';
    }

    supportLevelLabel(level: string | undefined): string {
        if (!level) return '';
        const labels: Record<string, string> = {
            email: 'Correo electrónico',
            priority: 'Prioritario',
            dedicated: 'Dedicado'
        };
        return labels[level] ?? level;
    }

    dashboardLevelLabel(level: string | undefined): string {
        if (!level) return '';
        const labels: Record<string, string> = {
            basic: 'Básico',
            advanced: 'Avanzado',
            full: 'Completo'
        };
        return labels[level] ?? level;
    }

    // ==================== Cancel subscription ====================

    cancelDialogVisible = signal(false);
    cancellingSubscription = signal(false);
    cancellationComplete = signal(false);

    isPaidPlan = computed(() => {
        const name = this.subscriptionUsage()?.subscription?.name?.toLowerCase() ?? '';
        return !!name && name !== 'free';
    });

    onOpenCancelDialog(): void {
        this.cancellationComplete.set(false);
        this.cancelDialogVisible.set(true);
    }

    onConfirmCancelSubscription(): void {
        const companyId = this.authService.currentProfile()?.companyId;
        if (!companyId) return;

        this.cancellingSubscription.set(true);
        this.companyService.cancelSubscription(companyId).pipe(
            finalize(() => this.cancellingSubscription.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.cancellationComplete.set(true);
        });
    }

    async onContinueAfterCancellation(): Promise<void> {
        const userId = this.authService.currentProfile()?.id;
        this.cancelDialogVisible.set(false);
        if (userId) {
            await this.authService.loadProfile(userId);
        }
        this.detailsResource.reload();
        this.router.navigate(['/app/panel']);
    }

    // ==================== Change plan ====================

    changePlanDialogVisible = signal(false);
    selectedNewPlan = signal<PlanItem | null>(null);
    changingPlan = signal(false);
    changeComplete = signal(false);
    loadingCompany = signal(false);

    currentCompany = signal<CompanyModel | null>(null);

    replaceCard = signal(false);
    replaceBilling = signal(false);

    cardForm = buildCardForm(() => detectCardType(this.cardForm.get('cardNumber')?.value ?? ''));
    cardBrand = computed(() => getCardBrand(detectCardType(this.cardForm.get('cardNumber')?.value ?? '')));

    billingForm = buildBillingForm();
    pendingBillingStateName = signal<string | null>(null);
    pendingBillingCityName = signal<string | null>(null);

    currentPlan = computed(() => this.subscriptionUsage()?.subscription ?? null);

    isFreePlanSelected = computed(() => (this.selectedNewPlan()?.price ?? 0) === 0);

    constructor() {
        // Toggle billing form disabled state based on replaceBilling
        effect(() => {
            const replace = this.replaceBilling();
            if (replace) {
                this.billingForm.enable({ emitEvent: false });
            } else {
                this.billingForm.disable({ emitEvent: false });
            }
        });

        // Toggle card form disabled state based on replaceCard
        effect(() => {
            const replace = this.replaceCard();
            if (replace) {
                this.cardForm.enable({ emitEvent: false });
            } else {
                this.cardForm.disable({ emitEvent: false });
            }
        });
    }

    onUpgrade(plan: PlanItem): void {
        this.selectedNewPlan.set(plan);
        this.replaceCard.set(false);
        this.replaceBilling.set(false);
        this.changeComplete.set(false);
        this.cardForm.reset();
        this.billingForm.reset();

        const companyId = this.companyId();
        if (!companyId) return;

        this.loadingCompany.set(true);
        this.companyService.getCompanyByUser(this.authService.currentProfile()!.id).pipe(
            finalize(() => this.loadingCompany.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(companies => {
            const company = companies?.[0] ?? null;
            this.currentCompany.set(company);
            if (company) {
                this.prefillBillingFromCompany(company);
            }
            this.changePlanDialogVisible.set(true);
        });
    }

    private prefillBillingFromCompany(company: CompanyModel): void {
        firstValueFrom(this.parameterService.getByType('identification_type')).then((idTypes: Parameter[]) => {
            const docType = idTypes.find(t => t.id === company.billingDocTypeId) ?? null;

            this.pendingBillingStateName.set(company.billingState ?? null);
            this.pendingBillingCityName.set(company.billingCity ?? null);

            this.billingForm.patchValue({
                billingName: company.billingName ?? '',
                billingLastName: company.billingLastName ?? '',
                billingDocType: docType,
                billingDocNumber: company.billingDocNumber ?? '',
                billingEmail: company.billingEmail ?? '',
                billingAddress: company.billingAddress ?? '',
                billingPhone: company.billingPhone ?? ''
            });
        });
    }

    canConfirmChange = computed(() => {
        if (this.changingPlan()) return false;
        if (this.isFreePlanSelected()) return true;
        if (this.replaceCard() && this.cardForm.invalid) return false;
        if (this.replaceBilling() && this.billingForm.invalid) return false;
        return true;
    });

    onConfirmChangePlan(): void {
        const companyId = this.companyId();
        const plan = this.selectedNewPlan();
        if (!companyId || !plan) return;

        const payload: ChangePlanRequest = { subscriptionId: plan.id };

        if (!this.isFreePlanSelected()) {
            if (this.replaceCard()) {
                if (this.cardForm.invalid) {
                    this.cardForm.markAllAsTouched();
                    return;
                }
                const card = this.cardForm.getRawValue();
                payload.card = {
                    cardNumber: (card.cardNumber as string).replace(/\s/g, ''),
                    cardName: card.cardName as string,
                    cvc: card.cvc as string,
                    expMonth: card.expMonth as string,
                    expYear: card.expYear as string
                };
            }

            if (this.replaceBilling()) {
                if (this.billingForm.invalid) {
                    this.billingForm.markAllAsTouched();
                    return;
                }
                const b = this.billingForm.getRawValue();
                payload.billing = {
                    name: b.billingName,
                    lastName: b.billingLastName,
                    docType: b.billingDocType?.id,
                    docTypeCode: b.billingDocType?.code ?? '',
                    docNumber: b.billingDocNumber,
                    email: b.billingEmail,
                    address: b.billingAddress,
                    state: b.billingState?.name ?? '',
                    city: b.billingCity?.name ?? '',
                    phone: b.billingPhone
                };
            }
        }

        this.changingPlan.set(true);
        this.companyService.changePlan(companyId, payload).pipe(
            finalize(() => this.changingPlan.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.changeComplete.set(true);
        });
    }

    onContinueAfterChange(): void {
        this.changePlanDialogVisible.set(false);
        window.location.reload();
    }

    onCloseChangePlanDialog(): void {
        this.changePlanDialogVisible.set(false);
        this.changeComplete.set(false);
        this.selectedNewPlan.set(null);
    }
}
