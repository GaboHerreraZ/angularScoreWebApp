import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { DashboardService } from './dashboard.service';
import { BasicDashboard, AdvancedDashboard } from '@/app/types/dashboard';

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
        DatePipe
    ],
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
    private dashboardService = inject(DashboardService);

    loading = signal(false);
    dashboardLevel = this.dashboardService.dashboardLevel;

    basicData = signal<BasicDashboard | null>(null);
    advancedData = signal<AdvancedDashboard | null>(null);

    data = computed<BasicDashboard | null>(() => this.basicData());

    // ── Chart configs ──────────────────────────────────────────────────────────

    studiesByStatusChart = computed(() => {
        const d = this.data();
        if (!d?.studiesByStatus?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.studiesByStatus.map(x => x.label),
                datasets: [{
                    data: d.studiesByStatus.map(x => x.count),
                    backgroundColor: [
                        s.getPropertyValue('--p-yellow-400').trim(),
                        s.getPropertyValue('--p-blue-400').trim(),
                        s.getPropertyValue('--p-green-400').trim(),
                        s.getPropertyValue('--p-red-400').trim()
                    ]
                }]
            },
            options: this.doughnutOptions()
        };
    });

    studiesByMonthChart = computed(() => {
        const d = this.data();
        if (!d?.studiesByMonth?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.studiesByMonth.map(m => this.formatMonth(m.month)),
                datasets: [{
                    label: 'Estudios',
                    data: d.studiesByMonth.map(m => m.count),
                    backgroundColor: s.getPropertyValue('--p-primary-400').trim(),
                    borderRadius: 4
                }]
            },
            options: this.barOptions()
        };
    });

    customersByPersonTypeChart = computed(() => {
        const d = this.data();
        if (!d?.customersByPersonType?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.customersByPersonType.map(p => p.label),
                datasets: [{
                    data: d.customersByPersonType.map(p => p.count),
                    backgroundColor: [
                        s.getPropertyValue('--p-indigo-400').trim(),
                        s.getPropertyValue('--p-teal-400').trim()
                    ]
                }]
            },
            options: this.doughnutOptions()
        };
    });

    stabilityDistributionChart = computed(() => {
        const d = this.advancedData();
        if (!d?.stabilityDistribution?.length) return null;
        const s = getComputedStyle(document.documentElement);
        const labelMap: Record<string, string> = {
            high_risk: 'Alto Riesgo (≤1.8)',
            medium_risk: 'Zona Gris (1.8-3.0)',
            low_risk: 'Zona Segura (>3.0)'
        };
        return {
            data: {
                labels: d.stabilityDistribution.map(x => labelMap[x.band] ?? x.band),
                datasets: [{
                    data: d.stabilityDistribution.map(x => x.count),
                    backgroundColor: [
                        s.getPropertyValue('--p-red-400').trim(),
                        s.getPropertyValue('--p-yellow-400').trim(),
                        s.getPropertyValue('--p-green-400').trim()
                    ]
                }]
            },
            options: this.doughnutOptions()
        };
    });

    paymentCapacityTrendChart = computed(() => {
        const d = this.advancedData();
        if (!d?.paymentCapacityTrend?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.paymentCapacityTrend.map(m => this.formatMonth(m.month)),
                datasets: [{
                    label: 'Cap. Pago Mensual Prom.',
                    data: d.paymentCapacityTrend.map(m => m.value),
                    fill: true,
                    borderColor: s.getPropertyValue('--p-primary-500').trim(),
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: this.lineOptions(true)
        };
    });

    turnoverIndicatorsChart = computed(() => {
        const d = this.advancedData();
        if (!d?.avgTurnoverIndicators) return null;
        const s = getComputedStyle(document.documentElement);
        const t = d.avgTurnoverIndicators;
        return {
            data: {
                labels: ['Cartera (días)', 'Inventario (días)', 'Proveedores (días)', 'Plazo máx. (días)'],
                datasets: [{
                    label: 'Días promedio',
                    data: [t.accountsReceivableTurnover, t.inventoryTurnover, Math.abs(t.suppliersTurnover), t.maximumPaymentTime],
                    backgroundColor: [
                        s.getPropertyValue('--p-blue-400').trim(),
                        s.getPropertyValue('--p-green-400').trim(),
                        s.getPropertyValue('--p-orange-400').trim(),
                        s.getPropertyValue('--p-purple-400').trim()
                    ],
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
                datasets: [{
                    label: 'Cupo solicitado',
                    data: d.topCustomersByCredit.map(c => c.totalCredit),
                    backgroundColor: s.getPropertyValue('--p-teal-400').trim(),
                    borderRadius: 4
                }]
            },
            options: this.horizontalBarOptions(true)
        };
    });

    revenueVsNetIncomeChart = computed(() => {
        const d = this.advancedData();
        if (!d?.revenueVsNetIncome?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.revenueVsNetIncome.map(m => this.formatMonth(m.month)),
                datasets: [
                    {
                        label: 'Ingresos prom.',
                        data: d.revenueVsNetIncome.map(m => m.avgRevenue),
                        backgroundColor: s.getPropertyValue('--p-blue-400').trim(),
                        borderRadius: 4
                    },
                    {
                        label: 'Utilidad neta prom.',
                        data: d.revenueVsNetIncome.map(m => m.avgNetIncome),
                        backgroundColor: s.getPropertyValue('--p-green-400').trim(),
                        borderRadius: 4
                    }
                ]
            },
            options: this.barOptions(true, true)
        };
    });

    debtStructureChart = computed(() => {
        const d = this.advancedData();
        if (!d?.avgDebtStructure) return null;
        const s = getComputedStyle(document.documentElement);
        const ds = d.avgDebtStructure;
        return {
            data: {
                labels: ['Pasivo corriente', 'Pasivo no corriente', 'Patrimonio'],
                datasets: [{
                    data: [ds.avgCurrentLiabilities, ds.avgNonCurrentLiabilities, ds.avgEquity],
                    backgroundColor: [
                        s.getPropertyValue('--p-red-400').trim(),
                        s.getPropertyValue('--p-orange-400').trim(),
                        s.getPropertyValue('--p-green-400').trim()
                    ]
                }]
            },
            options: this.doughnutOptions()
        };
    });

    analystChart = computed(() => {
        const d = this.advancedData();
        if (!d?.studiesByAnalyst?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.studiesByAnalyst.map(a => a.analystName),
                datasets: [{
                    label: 'Estudios realizados',
                    data: d.studiesByAnalyst.map(a => a.count),
                    backgroundColor: s.getPropertyValue('--p-indigo-400').trim(),
                    borderRadius: 4
                }]
            },
            options: this.barOptions()
        };
    });

    economicActivityChart = computed(() => {
        const d = this.advancedData();
        if (!d?.customersByEconomicActivity?.length) return null;
        const s = getComputedStyle(document.documentElement);
        return {
            data: {
                labels: d.customersByEconomicActivity.map(e => e.label),
                datasets: [{
                    label: 'Clientes',
                    data: d.customersByEconomicActivity.map(e => e.count),
                    backgroundColor: s.getPropertyValue('--p-cyan-400').trim(),
                    borderRadius: 4
                }]
            },
            options: this.horizontalBarOptions()
        };
    });

    ngOnInit(): void {
        this.loadBasic();
        if (this.dashboardLevel() === 'advanced') {
            this.loadAdvanced();
        }
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

    formatMonth(month: string): string {
        const [year, m] = month.split('-');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${months[parseInt(m, 10) - 1]} ${year}`;
    }

    formatCompactCurrency(value: number): string {
        if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
        return `$${value}`;
    }

    private loadBasic(): void {
        this.loading.set(true);
        this.dashboardService.getBasicDashboard().subscribe(data => {
            this.basicData.set(data);
            this.loading.set(false);
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
        ).subscribe(data => {
            this.advancedData.set(data as AdvancedDashboard | null);
            this.loading.set(false);
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

    private lineOptions(currency = false) {
        const s = getComputedStyle(document.documentElement);
        const textMuted = s.getPropertyValue('--p-text-muted-color').trim();
        const border = s.getPropertyValue('--p-content-border-color').trim();
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: textMuted }, grid: { color: border } },
                y: {
                    ticks: {
                        color: textMuted,
                        ...(currency ? { callback: (v: number) => this.formatCompactCurrency(v) } : {})
                    },
                    grid: { color: border }
                }
            }
        };
    }

    private horizontalBarOptions(currency = false) {
        const s = getComputedStyle(document.documentElement);
        const textMuted = s.getPropertyValue('--p-text-muted-color').trim();
        const border = s.getPropertyValue('--p-content-border-color').trim();
        return {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
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
