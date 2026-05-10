import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import type { KpiValue } from '@/app/types/dashboard';

type Trend = 'up' | 'down' | 'flat' | 'new' | 'none';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, CardModule, TooltipModule],
    templateUrl: './kpi-card.html'
})
export class KpiCard {
    label = input.required<string>();
    icon = input.required<string>();
    color = input.required<string>();
    kpi = input.required<KpiValue>();
    formattedValue = input<string | null>(null);
    formattedPrevious = input<string | null>(null);
    suffix = input<string | null>(null);
    invertTrend = input<boolean>(false);

    trend = computed<Trend>(() => {
        const k = this.kpi();
        if (!k || typeof k !== 'object' || !('deltaPercent' in k)) return 'none';
        if (k.deltaPercent === null || k.deltaPercent === undefined) {
            if (k.previous === 0 && k.delta > 0) return 'new';
            return 'none';
        }
        if (k.delta === 0) return 'flat';
        return k.delta > 0 ? 'up' : 'down';
    });

    trendIsGood = computed<boolean>(() => {
        const t = this.trend();
        if (t === 'flat' || t === 'none') return false;
        if (t === 'new') return !this.invertTrend();
        return this.invertTrend() ? t === 'down' : t === 'up';
    });

    trendIcon = computed<string>(() => {
        switch (this.trend()) {
            case 'up':
            case 'new':
                return 'pi pi-arrow-up';
            case 'down': return 'pi pi-arrow-down';
            case 'flat': return 'pi pi-minus';
            default: return '';
        }
    });

    trendClass = computed<string>(() => {
        const t = this.trend();
        if (t === 'flat' || t === 'none') return 'text-surface-500 bg-surface-100 dark:bg-surface-800';
        return this.trendIsGood()
            ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
            : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30';
    });

    deltaLabel = computed<string>(() => {
        const k = this.kpi();
        const t = this.trend();
        if (t === 'new') return 'Nuevo';
        if (k.deltaPercent === null) return 'n/a';
        if (k.delta === 0) return '0%';
        const sign = k.delta > 0 ? '+' : '';
        return `${sign}${k.deltaPercent}%`;
    });

    tooltipText = computed<string>(() => {
        const k = this.kpi();
        const t = this.trend();
        const prev = this.formattedPrevious() ?? this.formatNumber(k.previous);
        if (t === 'new') return 'Sin datos del período anterior para comparar.';
        if (k.deltaPercent === null) return `Período anterior: ${prev}. Sin comparación disponible.`;
        const direction = k.delta > 0 ? 'Aumento' : k.delta < 0 ? 'Disminución' : 'Sin cambio';
        return `${direction} respecto al período anterior (${prev})`;
    });

    private formatNumber(n: number): string {
        return new Intl.NumberFormat('es-CO').format(n);
    }
}
