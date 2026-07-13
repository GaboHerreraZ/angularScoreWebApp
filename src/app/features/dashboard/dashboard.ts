import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { DashboardService } from './dashboard.service';
import { BasicDashboard, AdvancedDashboard, RecentStudy } from '@/app/types/dashboard';
import { HelpTooltip } from '@/app/shared/components/help-tooltip/help-tooltip';
import { AuthService } from '@/app/core/services/auth.service';
import { KpiCard } from '@/app/shared/components/kpi-card/kpi-card';
import { formatCurrency, formatCompactCurrency } from '@/app/shared/utils/format.util';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ChartModule,
        TableModule,
        TagModule,
        SkeletonModule,
        ButtonModule,
        CurrencyPipe,
        DatePipe,
        HelpTooltip,
        KpiCard
    ],
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
    private dashboardService = inject(DashboardService);
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);

    loading = signal(false);
    lastUpdated = signal<Date | null>(null);
    currentTime = signal<Date>(new Date());

    greeting = computed(() => {
        const hour = this.currentTime().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
    });

    userFirstName = computed(() => {
        const profile = this.authService.currentProfile();
        return profile?.name?.trim().split(' ')[0] ?? '';
    });

    formattedDate = computed(() => {
        return this.currentTime().toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    });

    lastUpdatedLabel = computed(() => {
        const updated = this.lastUpdated();
        const now = this.currentTime();
        if (!updated) return null;
        const diffMs = now.getTime() - updated.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'hace unos segundos';
        if (diffMin === 1) return 'hace 1 minuto';
        if (diffMin < 60) return `hace ${diffMin} minutos`;
        const diffHours = Math.floor(diffMin / 60);
        if (diffHours === 1) return 'hace 1 hora';
        if (diffHours < 24) return `hace ${diffHours} horas`;
        return updated.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    });

    chartTooltips: Record<string, string> = {
        studiesByMonth: 'Cantidad total de estudios de credito realizados mes a mes, para visualizar la tendencia de actividad.',
        recentStudies: 'Listado de los estudios de credito mas recientes con su cliente, fecha, estado, cupos y veredicto de viabilidad.',
        pipeline: 'Cantidad de estudios del periodo segun la etapa del proceso en la que se encuentran.',
        verdicts: 'Resultado de viabilidad de los estudios analizados en el periodo: aprobados, condicionados y rechazados.',
        bureauRisk: 'Distribucion de los clientes consultados en centrales de riesgo segun la banda de su score de buro.',
        topCustomers: 'Los clientes con mayor cupo de credito solicitado en el periodo, comparando cupo solicitado vs aprobado.'
    };

    basicData = signal<BasicDashboard | null>(null);
    advancedData = signal<AdvancedDashboard | null>(null);

    data = computed<BasicDashboard | null>(() => this.basicData());

    // Estudios recientes: se prefiere la lista del endpoint avanzado (acotada al periodo consultado).
    recentStudiesList = computed<RecentStudy[]>(
        () => this.advancedData()?.recentStudies ?? this.data()?.recentStudies ?? []
    );

    // ── Chart configs ──────────────────────────────────────────────────────────

    studiesByMonthChart = computed(() => {
        // El endpoint avanzado trae la serie acotada al periodo consultado; se prefiere sobre la basica.
        const months = this.advancedData()?.studiesByMonth ?? this.data()?.studiesByMonth;
        if (!months?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: months.map(m => this.formatMonth(m.month)),
                datasets: [{
                    label: 'Estudios',
                    data: months.map(m => m.count),
                    backgroundColor: s.getPropertyValue('--p-primary-400').trim(),
                    borderRadius: 4
                }]
            },
            options: this.barOptions()
        };
    });

    pipelineChart = computed(() => {
        // El endpoint avanzado trae el pipeline acotado al periodo consultado; se prefiere sobre el basico.
        const pipeline = this.advancedData()?.pipeline ?? this.data()?.pipeline;
        if (!pipeline?.length) return null;
        const s = getComputedStyle(document.documentElement);
        const colorByCode: Record<string, string> = {
            pending: '--p-yellow-400',
            inProgress: '--p-cyan-400',
            studyCompleted: '--p-blue-400',
            approved: '--p-green-400',
            conditional: '--p-orange-400',
            rejected: '--p-red-400'
        };
        const fallback = ['--p-primary-400', '--p-purple-400', '--p-teal-400', '--p-indigo-400', '--p-pink-400'];
        return {
            data: {
                labels: pipeline.map(x => x.label),
                datasets: [{
                    data: pipeline.map(x => x.count),
                    backgroundColor: pipeline.map((x, i) =>
                        s.getPropertyValue(colorByCode[x.code] ?? fallback[i % fallback.length]).trim()
                    )
                }]
            },
            options: this.doughnutOptions()
        };
    });

    verdictsChart = computed(() => {
        const v = this.advancedData()?.verdicts;
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

    bureauRiskChart = computed(() => {
        const d = this.advancedData();
        if (!d?.bureauRisk?.byBand?.length || d.bureauRisk.consultedCustomers === 0) return null;
        const s = getComputedStyle(document.documentElement);
        const colorByBand: Record<string, string> = {
            excellent: '--p-green-500',
            good: '--p-green-400',
            acceptable: '--p-yellow-400',
            fair: '--p-orange-400',
            high_risk: '--p-red-400'
        };
        return {
            data: {
                labels: d.bureauRisk.byBand.map(b => b.label),
                datasets: [{
                    label: 'Clientes',
                    data: d.bureauRisk.byBand.map(b => b.count),
                    backgroundColor: d.bureauRisk.byBand.map(b =>
                        s.getPropertyValue(colorByBand[b.code] ?? '--p-primary-400').trim()
                    ),
                    borderRadius: 4
                }]
            },
            options: this.horizontalBarOptions()
        };
    });

    topCustomersChart = computed(() => {
        const d = this.advancedData();
        if (!d?.topCustomersByCredit?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.topCustomersByCredit.map(c => c.businessName),
                datasets: [
                    {
                        label: 'Cupo solicitado',
                        data: d.topCustomersByCredit.map(c => c.totalRequested),
                        backgroundColor: s.getPropertyValue('--p-blue-400').trim(),
                        borderRadius: 4
                    },
                    {
                        label: 'Cupo aprobado',
                        data: d.topCustomersByCredit.map(c => c.totalApproved),
                        backgroundColor: s.getPropertyValue('--p-green-400').trim(),
                        borderRadius: 4
                    }
                ]
            },
            options: this.horizontalBarOptions(true, true)
        };
    });

    periodLabel = computed(() => {
        const p = this.advancedData()?.period;
        if (!p) return null;
        const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${fmt(p.from)} – ${fmt(p.to)}`;
    });

    ngOnInit(): void {
        this.loadBasic();
        this.loadAdvanced();
        const interval = setInterval(() => this.currentTime.set(new Date()), 60_000);
        this.destroyRef.onDestroy(() => clearInterval(interval));
    }

    refresh(): void {
        this.loadBasic();
        this.loadAdvanced();
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            'Aprobado': 'success',
            'Pendiente': 'warn',
            'Rechazado': 'danger',
            'Estudio Realizado': 'info'
        };
        return map[status] ?? 'secondary';
    }

    getVerdictSeverity(status: string | null | undefined): 'success' | 'warn' | 'danger' | 'secondary' {
        const map: Record<string, 'success' | 'warn' | 'danger'> = {
            approved: 'success',
            conditional: 'warn',
            rejected: 'danger'
        };
        return map[status ?? ''] ?? 'secondary';
    }

    getVerdictLabel(status: string | null | undefined): string {
        const map: Record<string, string> = {
            approved: 'Aprobado',
            conditional: 'Condicionado',
            rejected: 'Rechazado'
        };
        return map[status ?? ''] ?? '—';
    }

    formatMonth(month: string): string {
        const [year, m] = month.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[parseInt(m, 10) - 1]} ${year}`;
    }

    // Expuestos al template; delegan en las utilidades compartidas.
    formatCurrency = formatCurrency;
    formatCompactCurrency = formatCompactCurrency;

    private loadBasic(): void {
        this.loading.set(true);
        this.dashboardService.getBasicDashboard()
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(data => {
                this.basicData.set(data);
                this.lastUpdated.set(new Date());
            });
    }

    private loadAdvanced(): void {
        this.loading.set(true);
        const dateTo = new Date();
        const dateFrom = new Date();
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        this.dashboardService.getAdvancedDashboard(
            this.toIsoDate(dateFrom),
            this.toIsoDate(dateTo)
        )
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(data => {
                this.advancedData.set(data);
                this.lastUpdated.set(new Date());
            });
    }

    private toIsoDate(d: Date): string {
        return d.toISOString().split('T')[0];
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
                        ...(currency ? { callback: (v: number) => this.formatCompactCurrency(v) } : {})
                    },
                    grid: { color: border },
                    beginAtZero: true
                }
            }
        };
    }

    private horizontalBarOptions(currency = false, showLegend = false) {
        const s = getComputedStyle(document.documentElement);
        const textMuted = s.getPropertyValue('--p-text-muted-color').trim();
        const border = s.getPropertyValue('--p-content-border-color').trim();
        return {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: showLegend, position: 'bottom', labels: { color: s.getPropertyValue('--p-text-color').trim() } }
            },
            scales: {
                x: {
                    ticks: {
                        color: textMuted,
                        ...(currency ? { callback: (v: number) => this.formatCompactCurrency(v) } : {})
                    },
                    grid: { color: border },
                    beginAtZero: true
                },
                y: { ticks: { color: textMuted } }
            }
        };
    }
}
