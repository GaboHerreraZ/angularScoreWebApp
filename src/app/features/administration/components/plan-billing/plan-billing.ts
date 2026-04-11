import { Component, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompanyService } from '../company/company.service';
import { AuthService } from '@/app/core/services/auth.service';
import { AvailablePlans, PlanItem } from '@/app/types/subscription';
import { SubscriptionPlansList } from '@/app/shared/components/subscription-plans-list/subscription-plans-list';

@Component({
    selector: 'app-plan-billing',
    standalone: true,
    imports: [SubscriptionPlansList],
    templateUrl: './plan-billing.html'
})
export class PlanBilling {
    private companyService = inject(CompanyService);
    private authService = inject(AuthService);

    private companyId = computed(() => {
        const profile = this.authService.currentProfile();
        return profile?.userCompanies?.[0]?.companyId ?? null;
    });

    plansResource = resource<AvailablePlans, string>({
        params: () => this.companyId() as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getAvailablePlans(companyId))
    });

    plans = computed(() => this.plansResource.value()?.plans ?? []);

    ctaLabelFn = (plan: PlanItem): string => (plan.isCurrent ? 'Plan actual' : 'Cambiar a este plan');
    ctaDisabledFn = (plan: PlanItem): boolean => !!plan.isCurrent;

    onUpgrade(plan: PlanItem): void {
        console.log('Upgrade to plan:', plan.id, plan.name);
    }
}
