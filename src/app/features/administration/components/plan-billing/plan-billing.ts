import { Component, computed, inject, resource, signal } from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { CompanyService } from '../company/company.service';
import { AuthService } from '@/app/core/services/auth.service';
import { AvailablePlans, PlanItem } from '@/app/types/subscription';

@Component({
    selector: 'app-plan-billing',
    standalone: true,
    imports: [
        DecimalPipe,
        NgClass,
        CardModule,
        ButtonModule,
        TagModule,
        SkeletonModule,
        DividerModule
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

    billingCycle = signal<'monthly' | 'annual'>('monthly');

    plansResource = resource<AvailablePlans, string>({
        params: () => this.companyId() as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getAvailablePlans(companyId))
    });

    plans = computed(() => {
        const all = this.plansResource.value()?.plans ?? [];
        const isMonthly = this.billingCycle() === 'monthly';
        return all.filter(p => p.isMonthly === isMonthly);
    });

    hasAnnualPlans = computed(() => {
        const all = this.plansResource.value()?.plans ?? [];
        return all.some(p => !p.isMonthly);
    });

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

    onUpgrade(plan: PlanItem): void {
        console.log('Upgrade to plan:', plan.id, plan.name);
    }
}
