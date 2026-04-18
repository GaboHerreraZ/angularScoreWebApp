import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { CompanyService } from '../company/company.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PlanItem, SubscriptionDetails } from '@/app/types/subscription';
import { SubscriptionPlansList } from '@/app/shared/components/subscription-plans-list/subscription-plans-list';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings } from '@/app/types/table';

@Component({
    selector: 'app-plan-billing',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
        ButtonModule,
        CardModule,
        TagModule,
        ProgressBarModule,
        SkeletonModule,
        TooltipModule,
        DialogModule,
        SubscriptionPlansList,
        CustomTable
    ],
    templateUrl: './plan-billing.html'
})
export class PlanBilling {
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);

    private companyId = computed(() => {
        const profile = this.authService.currentProfile();
        return profile?.userCompanies?.[0]?.companyId ?? null;
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

    onUpgrade(plan: PlanItem): void {
        console.log('Upgrade to plan:', plan.id, plan.name);
    }

    cancelDialogVisible = signal(false);
    cancellingSubscription = signal(false);

    isPaidPlan = computed(() => {
        const usage = this.subscriptionUsage();
        return !!usage && usage.subscription.price > 0;
    });

    onOpenCancelDialog(): void {
        this.cancelDialogVisible.set(true);
    }

    onConfirmCancelSubscription(): void {
        this.cancelSubscription();
    }

    private cancelSubscription(): void {
        // TODO: implementar llamada al servicio para cancelar suscripción
    }
}
