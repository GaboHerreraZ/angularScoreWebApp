import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { SubscriptionService } from '@/app/features/subscription/subscription.service';
import { PlanItem } from '@/app/types/subscription';
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

    /** Correo del área comercial para cotizar planes. */
    readonly salesEmail = 'comercial@creditia.co';

    loading = signal(true);
    plans = signal<PlanItem[]>([]);

    constructor() {
        this.subscriptionService.getPublicPlans().pipe(take(1)).subscribe({
            next: (response) => {
                this.plans.set(response.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    ctaLabelFn = (): string => 'Hablar con el área comercial';

    onPlanSelected(plan: PlanItem): void {
        // En vez de auto-suscribir, abrimos un correo al área comercial para cotizar el plan elegido.
        const subject = encodeURIComponent(`Cotización plan ${plan.name} - CREDITIA`);
        const body = encodeURIComponent(
            `Hola, estoy interesado en el plan "${plan.name}" de CREDITIA y me gustaría recibir más información para cotizarlo.`
        );
        window.location.href = `mailto:${this.salesEmail}?subject=${subject}&body=${body}`;
    }
}
