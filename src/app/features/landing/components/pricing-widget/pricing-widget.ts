import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { SubscriptionService } from '@/app/features/subscription/subscription.service';
import { Campaign, PlanItem } from '@/app/types/subscription';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { SubscriptionPlansList } from '@/app/shared/components/subscription-plans-list/subscription-plans-list';

@Component({
    standalone: true,
    selector: 'pricing-widget',
    imports: [CommonModule, ScrollAnimateDirective, SubscriptionPlansList],
    templateUrl: './pricing-widget.html'
})
export class PricingWidget {
    private subscriptionService = inject(SubscriptionService);
    private router = inject(Router);

    loading = signal(true);
    plans = signal<PlanItem[]>([]);
    campaign = signal<Campaign | null>(null);

    constructor() {
        this.subscriptionService.getPublicPlans().pipe(take(1)).subscribe({
            next: (response) => {
                this.campaign.set(response.campaign);
                this.plans.set(response.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    ctaLabelFn = (plan: PlanItem): string => {
        if (plan.price === 0) return 'Comenzar Gratis';
        const sorted = [...this.plans()].sort((a, b) => a.price - b.price);
        if (sorted.length > 2 && sorted[sorted.length - 1]?.id === plan.id) return 'Contactar Ventas';
        return 'Empezar Ahora';
    };

    onPlanSelected(_plan: PlanItem): void {
        this.router.navigate(['/auth/iniciar-sesion']);
    }
}
