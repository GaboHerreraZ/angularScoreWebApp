import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { PlanItem } from '@/app/types/subscription';

export interface PlanCardView extends PlanItem {
    ctaLabel: string;
    ctaDisabled: boolean;
    ctaOutlined: boolean;
    popular: boolean;
    limits: string[];
    features: { label: string; included: boolean }[];
    cardDescription: string;
}

export type CtaLabelFn = (plan: PlanItem) => string;
export type PlanPredicate = (plan: PlanItem) => boolean;

@Component({
    selector: 'app-subscription-plans-list',
    standalone: true,
    imports: [CommonModule, ButtonModule, Ripple, SkeletonModule],
    templateUrl: './subscription-plans-list.html'
})
export class SubscriptionPlansList {
    plans = input<PlanItem[]>([]);
    loading = input<boolean>(false);

    /** Precio fijo por consulta mientras el modelo de cobro es consultivo. */
    readonly hardcodedPrice = '$25.000';
    readonly priceUnit = 'consulta';
    // Parent decides the CTA label for each plan
    ctaLabelFn = input<CtaLabelFn>(() => 'Seleccionar');
    // Parent may disable specific plans (e.g. current plan)
    ctaDisabledFn = input<PlanPredicate>(() => false);
    // Parent may request a specific plan to be rendered as popular
    popularFn = input<PlanPredicate | null>(null);
    // Show "Plan actual" tag on plans flagged as current (for authenticated views)
    showCurrentBadge = input<boolean>(false);

    planAction = output<PlanItem>();

    viewPlans = computed<PlanCardView[]>(() => {
        const sorted = this.plans() ?? [];
        const popular = this.popularFn();
        const ctaLabel = this.ctaLabelFn();
        const ctaDisabled = this.ctaDisabledFn();
        const hasCurrentPlan = this.showCurrentBadge() && sorted.some(p => p.isCurrent);

        return sorted.map((item, index) => {
            const isPopular = hasCurrentPlan
                ? false
                : popular ? popular(item) : sorted.length > 1 && index === Math.floor(sorted.length / 2);
            const isHighlighted = hasCurrentPlan ? !!item.isCurrent : isPopular;

            return {
                ...item,
                cardDescription: item.description || this.defaultDescription(index, sorted.length),
                popular: isPopular,
                limits: this.buildLimits(item),
                features: this.buildFeatures(item),
                ctaLabel: ctaLabel(item),
                ctaDisabled: ctaDisabled(item),
                ctaOutlined: !isHighlighted
            };
        });
    });

    onPlanClick(plan: PlanCardView): void {
        if (plan.ctaDisabled) return;
        this.planAction.emit(plan);
    }

    private defaultDescription(index: number, total: number): string {
        if (index === 0) return 'Ideal para empezar con el análisis crediticio';
        if (index === total - 1) return 'Para empresas con operaciones a gran escala';
        return 'Para equipos que necesitan más capacidad';
    }

    private buildLimits(item: PlanItem): string[] {
        const limits: string[] = [];
        limits.push(item.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${item.maxUsers} usuario${item.maxUsers > 1 ? 's' : ''}`);
        limits.push(item.maxCompanies === -1 ? 'Empresas ilimitadas' : `${item.maxCompanies} empresa${item.maxCompanies > 1 ? 's' : ''}`);
        limits.push(
            item.maxCustomers == null || item.maxCustomers === -1
                ? 'Clientes ilimitados'
                : `Hasta ${item.maxCustomers} cliente${item.maxCustomers > 1 ? 's' : ''}`
        );
        limits.push(
            item.maxStudiesPerMonth == null || item.maxStudiesPerMonth === -1
                ? 'Estudios ilimitados / mes'
                : `${item.maxStudiesPerMonth} estudio${item.maxStudiesPerMonth > 1 ? 's' : ''} / mes`
        );
        if (item.maxAiAnalysisPerMonth != null && item.maxAiAnalysisPerMonth > 0) {
            limits.push(
                item.maxAiAnalysisPerMonth === -1
                    ? 'Análisis IA ilimitados / mes'
                    : `${item.maxAiAnalysisPerMonth} análisis IA / mes`
            );
        }
        if (item.maxPdfExtractionsPerMonth != null && item.maxPdfExtractionsPerMonth > 0) {
            limits.push(
                item.maxPdfExtractionsPerMonth === -1
                    ? 'Extracciones PDF ilimitadas / mes'
                    : `${item.maxPdfExtractionsPerMonth} extracciones PDF / mes`
            );
        }
        return limits;
    }

    private buildFeatures(item: PlanItem): { label: string; included: boolean }[] {
        return [
            { label: 'Reportes Excel', included: true },
            { label: 'Personalización de tema', included: true },
            { label: 'Análisis con Inteligencia Artificial', included: item.maxAiAnalysisPerMonth != null && item.maxAiAnalysisPerMonth !== 0 },
            { label: 'Extracción de datos PDF', included: item.maxPdfExtractionsPerMonth != null && item.maxPdfExtractionsPerMonth !== 0 }
        ];
    }
}
