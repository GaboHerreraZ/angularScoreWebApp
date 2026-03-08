import { Component, computed, inject, resource } from '@angular/core';
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

    plansResource = resource<AvailablePlans, string>({
        params: () => this.companyId() as string,
        loader: ({ params: companyId }) => firstValueFrom(this.companyService.getAvailablePlans(companyId))
    });

    plans = computed(() => this.plansResource.value()?.plans ?? []);

    supportLevelLabel(levelId: number | undefined): string {
        if (levelId == null) return '';
        const labels: Record<number, string> = {
            18: 'Correo electrónico',
            19: 'Prioritario',
            20: 'Dedicado'
        };
        return labels[levelId] ?? `Nivel ${levelId}`;
    }

    dashboardLevelLabel(levelId: number | undefined): string {
        if (levelId == null) return '';
        const labels: Record<number, string> = {
            16: 'Básico',
            17: 'Avanzado',
            18: 'Completo'
        };
        return labels[levelId] ?? `Nivel ${levelId}`;
    }

    onUpgrade(plan: PlanItem): void {
        console.log('Upgrade to plan:', plan.id, plan.name);
    }
}
