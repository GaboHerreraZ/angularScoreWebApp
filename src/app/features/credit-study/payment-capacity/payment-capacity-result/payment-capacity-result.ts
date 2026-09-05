import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudyResult } from '../../credit-study-detail/study-result/study-result';
import { AmortizationSimulator } from '../amortization-simulator/amortization-simulator';
import { CustomerCentralRisk, PerformStudyResponse } from '@/app/types/credit-study';
import {
    CreditStudyDocumentsStep,
    DetectedObligation,
    EmploymentTypeCode,
    MonthlyIncomePoint
} from '@/app/types/payment-capacity';
import { formatMonth } from '@/app/shared/utils/format.util';

interface IncomeSeriesRow {
    month: string;
    label: string;
    income: number;
    deposits: number;
    /** Alto relativo de la barra respecto al mes de mayor ingreso. */
    fillPercent: number;
}

/** Una celda del desglose: cuánto se pagó a esa contraparte en ese mes. */
interface ObligationMonthCell {
    label: string;
    amount: number;
}

/**
 * Fila de una obligación. Se muestran el TOTAL del período y el desglose mes a
 * mes además del promedio: el promedio solo es un total dividido entre los meses
 * del extracto, y sin el total al lado es una cifra que no se puede buscar en el
 * PDF (un pago único de $734.714 aparecía impreso como $244.905).
 */
interface ObligationRow {
    counterparty: string;
    total: number;
    monthlyAverage: number;
    paymentCount: number;
    monthlyCells: ObligationMonthCell[];
    detail: string;
    months: number;
    /** Libranzas y embargos: vienen del desprendible, no de la cuenta. */
    fromStub: boolean;
}

/**
 * Los tres grupos en que se presentan las obligaciones. La diferencia no es si
 * el pago ocurrió —eso siempre consta en el extracto— sino qué tan seguro es
 * que sea una DEUDA, y por eso cada grupo se lee distinto.
 */
interface ObligationGroup {
    kind: 'loan' | 'card' | 'probable_installment';
    title: string;
    hint: string;
    tagLabel: string;
    tagClasses: string;
    rows: ObligationRow[];
    /** Suma de los promedios mensuales del grupo. */
    total: number;
    /** Suma de los totales del período del grupo. */
    periodTotal: number;
}

const GROUP_META: Record<
    ObligationGroup['kind'],
    Omit<ObligationGroup, 'kind' | 'rows' | 'total' | 'periodTotal'>
> = {
    loan: {
        title: 'Cuotas de crédito',
        hint: 'Pagos a prestamistas identificados en la descripción del movimiento. Cuentan como deuda y entran en el endeudamiento; incluyen obligaciones que la central puede no reportar.',
        tagLabel: 'Deuda',
        tagClasses: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    },
    card: {
        title: 'Pago de tarjetas de crédito',
        hint: 'Sale de la cuenta todos los meses, así que resta del ingreso disponible. NO se cuenta como cuota de deuda: el extracto no distingue el pago mínimo (deuda) del pago total (consumo del mes).',
        tagLabel: 'No es cuota',
        tagClasses: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    },
    probable_installment: {
        title: 'Pagos recurrentes por verificar',
        hint: 'Transferencias del mismo monto a la misma contraparte, repetidas mes a mes. Parecen un compromiso fijo, pero el extracto no dice de qué: puede ser una cuota en otra entidad, un arriendo o un giro familiar. Verifíquelo con el titular.',
        tagLabel: 'Por verificar',
        tagClasses: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }
};

/**
 * Paso 3 del estudio de capacidad. El veredicto, las dimensiones, las alertas,
 * la central y el análisis con IA son los mismos del estudio empresarial (los
 * renderiza StudyResult); lo propio de este producto es la evidencia del flujo
 * de caja: la serie de ingreso mes a mes, las obligaciones detectadas en la
 * cuenta y el comportamiento del titular.
 */
@Component({
    selector: 'app-payment-capacity-result',
    standalone: true,
    imports: [CommonModule, StudyResult, AmortizationSimulator],
    templateUrl: './payment-capacity-result.html'
})
export class PaymentCapacityResult {
    study = input.required<PerformStudyResponse>();
    creditStudyId = input<string>();
    customer = input<{ businessName?: string; identificationNumber?: string; city?: string }>();
    companyInfo = input<{ name: string; city: string; nit: string }>();
    centralRisk = input<CustomerCentralRisk | null>(null);
    readOnly = input<boolean>(false);
    /** Step 2 del estudio: de ahí salen la serie, las obligaciones y la cobertura. */
    documentsStep = input<CreditStudyDocumentsStep | null>(null);
    employmentType = input<EmploymentTypeCode>('salaried');

    private analysis = computed(() => this.documentsStep()?.analysis ?? null);

    /** Insumos del simulador: salen del resultado congelado del estudio. */
    private capacityFigures = computed(() => this.study().result?.capacityFigures ?? null);
    maxInstallment = computed(() => this.capacityFigures()?.maxSuggestedInstallment ?? 0);
    requestedAmount = computed(() =>
        this.capacityFigures() ? (this.study().result?.approvedCreditLine?.requested ?? null) : null
    );

    employmentLabel = computed(() => this.employmentType() === 'independent' ? 'Independiente' : 'Asalariado');

    /** Antigüedad tomada del desprendible (verificada), no la declarada. */
    verifiedHireDate = computed(() => this.analysis()?.verifiedHireDate ?? null);

    paysOwnSocialSecurity = computed(() => this.analysis()?.paysOwnSocialSecurity ?? false);

    coverageLine = computed(() => {
        const coverage = this.documentsStep()?.coverage;
        if (!coverage) return null;
        const parts = [`${coverage.coveredMonths} de ${coverage.requiredMonths} mes(es) de extractos`];
        if (coverage.payrollStubs > 0) parts.push(`${coverage.payrollStubs} desprendible(s)`);
        if (coverage.contractorInvoices > 0) parts.push(`${coverage.contractorInvoices} factura(s)`);
        return parts.join(' · ');
    });

    incomeSeries = computed<IncomeSeriesRow[]>(() => {
        const series = (this.analysis()?.monthlyIncomeSeries ?? []) as MonthlyIncomePoint[];
        if (!series.length) return [];
        const max = Math.max(...series.map(p => p.income), 1);
        return series.map(point => ({
            month: point.month,
            label: formatMonth(point.month),
            income: point.income,
            deposits: point.deposits,
            fillPercent: Math.round((point.income / max) * 100)
        }));
    });

    /** Obligaciones agrupadas por naturaleza, en el orden en que se leen. */
    obligationGroups = computed<ObligationGroup[]>(() => {
        const all = (this.analysis()?.detectedObligations ?? []) as DetectedObligation[];
        const order: ObligationGroup['kind'][] = ['loan', 'card', 'probable_installment'];

        return order.flatMap(kind => {
            const rows = all
                .filter(o => o.kind === kind)
                .map<ObligationRow>(o => ({
                    counterparty: o.counterparty,
                    // Los estudios anteriores al desglose no traen el total: se
                    // reconstruye desde el promedio para no dejar la fila vacía.
                    total: o.totalAmount ?? o.monthlyAverage * (this.windowMonths() || 1),
                    monthlyAverage: o.monthlyAverage,
                    paymentCount: o.paymentCount ?? 0,
                    monthlyCells: (o.monthlyTotals ?? []).map(m => ({
                        label: formatMonth(m.month, 'monthOnly'),
                        amount: m.amount
                    })),
                    detail: o.detail,
                    months: o.months?.length ?? 0,
                    fromStub: o.source === 'payrollStub'
                }));
            if (!rows.length) return [];
            return [{
                kind,
                ...GROUP_META[kind],
                rows,
                total: rows.reduce((acc, r) => acc + r.monthlyAverage, 0),
                periodTotal: rows.reduce((acc, r) => acc + r.total, 0)
            }];
        });
    });

    obligationsTotal = computed(() =>
        this.obligationGroups().reduce((acc, g) => acc + g.total, 0)
    );

    obligationsPeriodTotal = computed(() =>
        this.obligationGroups().reduce((acc, g) => acc + g.periodTotal, 0)
    );

    /** Meses de extracto sobre los que se promedia: es el divisor que explica
     *  cada promedio de la tabla. */
    windowMonths = computed(() => this.analysis()?.coveredMonths ?? 0);

    /** Señales del manejo de la cuenta, ya formateadas para mostrar. */
    behaviorRows = computed<{ label: string; value: string; hint: string }[]>(() => {
        const behavior = this.analysis()?.behavior;
        if (!behavior) return [];

        const money = (v: number | null | undefined) =>
            v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
        const percent = (v: number | null | undefined) => v == null ? '—' : `${Math.round(v * 100)}%`;

        return [
            { label: 'Saldo promedio', value: money(behavior.averageBalance), hint: 'Colchón que mantiene en la cuenta' },
            { label: 'Saldo mínimo', value: money(behavior.minBalance), hint: 'El punto más bajo del periodo' },
            { label: 'Días en negativo', value: String(behavior.daysNegative ?? 0), hint: 'Días con la cuenta sobregirada' },
            { label: 'Días en cero', value: String(behavior.daysAtZero ?? 0), hint: 'Días sin saldo disponible' },
            { label: 'Retiro tras el ingreso', value: percent(behavior.pctWithdrawn48h), hint: 'Porcentaje retirado en las 48 horas siguientes' },
            { label: 'Apuestas sobre el ingreso', value: percent(behavior.gamblingPctOfIncome), hint: 'Gasto en juegos y apuestas en línea' }
        ];
    });

    hasCashFlowEvidence = computed(() =>
        this.incomeSeries().length > 0 || this.obligationGroups().length > 0 || this.behaviorRows().length > 0
    );

}
