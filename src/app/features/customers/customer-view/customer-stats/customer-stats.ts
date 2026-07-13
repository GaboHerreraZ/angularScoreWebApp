import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CustomersService } from '../../customers.service';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';
import { CustomerStats as CustomerStatsModel } from '@/app/types/customer-stats';
import { formatCurrency, formatCompactCurrency } from '@/app/shared/utils/format.util';

@Component({
    selector: 'app-customer-stats',
    standalone: true,
    imports: [CommonModule, CardModule, ChartModule, TagModule, SkeletonModule, HelpTooltip],
    templateUrl: './customer-stats.html'
})
export class CustomerStats {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private customersService = inject(CustomersService);

    customerId = toSignal(
        this.route.parent!.params.pipe(map(params => params['id'] as string))
    );

    loading = signal(false);
    stats = signal<CustomerStatsModel | null>(null);

    constructor() {
        effect(() => {
            const id = this.customerId();
            if (id) this.loadStats(id);
        });
    }

    private loadStats(id: string): void {
        this.loading.set(true);
        this.customersService.getCustomerStats(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(stats => this.stats.set(stats));
    }

    hasStudies = computed(() => (this.stats()?.studies.total ?? 0) > 0);

    // ── Tendencia del score ────────────────────────────────────────────────
    scoreTrend = computed(() => {
        const trend = this.stats()?.viability.scoreTrend;
        const map: Record<string, { icon: string; classes: string; label: string }> = {
            up: { icon: 'pi pi-arrow-up', classes: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30', label: 'En alza' },
            down: { icon: 'pi pi-arrow-down', classes: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30', label: 'A la baja' },
            flat: { icon: 'pi pi-minus', classes: 'text-surface-500 bg-surface-100 dark:bg-surface-800', label: 'Estable' }
        };
        return trend ? map[trend] ?? null : null;
    });

    lastVerdict = computed(() => {
        const status = this.stats()?.viability.lastStatus;
        return { label: this.verdictLabel(status), severity: this.verdictSeverity(status) };
    });

    // ── Gráfico: estudios por estado ───────────────────────────────────────
    statusChart = computed(() => {
        const byStatus = this.stats()?.studies.byStatus;
        if (!byStatus?.length) return null;
        const s = getComputedStyle(document.documentElement);
        const colorByCode: Record<string, string> = {
            confirmed: '--p-green-400',
            closed: '--p-blue-400',
            rejected: '--p-red-400',
            pendingSignature: '--p-yellow-400',
            pending: '--p-orange-400',
            inProgress: '--p-cyan-400'
        };
        const fallback = ['--p-primary-400', '--p-purple-400', '--p-teal-400', '--p-indigo-400', '--p-pink-400'];
        return {
            data: {
                labels: byStatus.map(x => x.label),
                datasets: [{
                    data: byStatus.map(x => x.count),
                    backgroundColor: byStatus.map((x, i) =>
                        s.getPropertyValue(colorByCode[x.code] ?? fallback[i % fallback.length]).trim()
                    )
                }]
            },
            options: this.doughnutOptions()
        };
    });

    // ── Gráfico: veredictos de viabilidad ──────────────────────────────────
    verdictsChart = computed(() => {
        const v = this.stats()?.viability;
        if (!v || v.analyzed === 0) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: ['Aprobados', 'Condicionados', 'Rechazados'],
                datasets: [{
                    data: [v.approved, v.conditional, v.rejected],
                    backgroundColor: [
                        s.getPropertyValue('--p-green-400').trim(),
                        s.getPropertyValue('--p-yellow-400').trim(),
                        s.getPropertyValue('--p-red-400').trim()
                    ]
                }]
            },
            options: this.doughnutOptions()
        };
    });

    // ── Gráfico: montos solicitado vs recomendado ──────────────────────────
    amountsChart = computed(() => {
        const a = this.stats()?.amounts;
        if (!a) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: ['Total', 'Promedio'],
                datasets: [
                    {
                        label: 'Solicitado',
                        data: [a.totalRequested, a.avgRequested],
                        backgroundColor: s.getPropertyValue('--p-blue-400').trim(),
                        borderRadius: 4
                    },
                    {
                        label: 'Recomendado',
                        data: [a.totalRecommended, a.avgRecommended],
                        backgroundColor: s.getPropertyValue('--p-green-400').trim(),
                        borderRadius: 4
                    }
                ]
            },
            options: this.barOptions(true, true)
        };
    });

    // Expuestos al template; delegan en las utilidades compartidas.
    formatCurrency = formatCurrency;
    formatCompactCurrency = formatCompactCurrency;

    private verdictLabel(status: string | null | undefined): string {
        const map: Record<string, string> = { approved: 'Aprobado', conditional: 'Condicionado', rejected: 'Rechazado' };
        return map[status ?? ''] ?? '—';
    }

    private verdictSeverity(status: string | null | undefined): 'success' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = { approved: 'success', conditional: 'warn', rejected: 'danger' };
        return map[status ?? ''] ?? 'secondary';
    }

    private doughnutOptions() {
        const s = getComputedStyle(document.documentElement);
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: s.getPropertyValue('--p-text-color').trim() } }
            }
        };
    }

    private barOptions(showLegend = false, currency = false) {
        const s = getComputedStyle(document.documentElement);
        const textMuted = s.getPropertyValue('--p-text-muted-color').trim();
        const border = s.getPropertyValue('--p-content-border-color').trim();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: showLegend, position: 'bottom', labels: { color: s.getPropertyValue('--p-text-color').trim() } }
            },
            scales: {
                x: { ticks: { color: textMuted }, grid: { color: border } },
                y: {
                    ticks: {
                        color: textMuted,
                        ...(currency ? { callback: (val: number) => this.formatCompactCurrency(val) } : {})
                    },
                    grid: { color: border },
                    beginAtZero: true
                }
            }
        };
    }
}
