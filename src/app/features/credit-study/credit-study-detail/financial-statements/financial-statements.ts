import { Component, computed, input, linkedSignal, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditStudyStep2, FinancialPeriod, FinancialSource } from '@/app/types/credit-study';

/** Formato de valor para una fila (moneda por defecto, o número/porcentaje/días). */
type RowFormat = 'currency' | 'number' | 'percent' | 'days' | 'ratio';

interface FieldRow {
    label: string;
    key: string;
    format?: RowFormat;
}

interface RowGroup {
    title: string;
    rows: FieldRow[];
}

interface SourceView {
    source: FinancialSource;
    label: string;
    icon: string;
    hasData: boolean;
    /** Columnas que ocupa la fuente en la tabla combinada (1 por periodo, mínimo 1). */
    cols: number;
    /** true si es la fuente elegida para el estudio (o la usada, si ya se realizó). */
    selected: boolean;
}

@Component({
    selector: 'app-financial-statements',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './financial-statements.html'
})
export class FinancialStatements {
    step2 = input.required<CreditStudyStep2>();

    /** Fuente elegida para ejecutar el estudio (two-way con el padre, que define el default). */
    selectedSource = model<string | null>(null);

    /**
     * true cuando el estudio ya se realizó o está cerrado: bloquea el cambio de
     * fuente; el resaltado pasa a indicar la fuente con la que se calculó.
     */
    readOnly = input(false);

    private readonly sourceMeta: Record<string, { label: string; icon: string }> = {
        pdf_upload: { label: 'Estados Financieros (PDF)', icon: 'pi pi-file-pdf' },
        datacredito: { label: 'Datacrédito', icon: 'pi pi-database' }
    };

    /** Fuentes con metadata de presentación, disponibilidad de datos y estado de selección. */
    sources = computed<SourceView[]>(() => {
        const selected = this.selectedSource();
        return (this.step2()?.sources ?? []).map(source => {
            const meta = this.sourceMeta[source.source] ?? { label: source.source, icon: 'pi pi-server' };
            const periodCount = source.periods?.length ?? 0;
            return {
                source,
                label: meta.label,
                icon: meta.icon,
                hasData: periodCount > 0,
                cols: Math.max(1, periodCount),
                selected: source.source === selected
            };
        });
    });

    /** Total de columnas de la tabla combinada (concepto + periodos de cada fuente). */
    totalCols = computed(() => 1 + this.sources().reduce((acc, v) => acc + v.cols, 0));

    // La matriz combinada no cabe en un teléfono: en móvil se ve una fuente y un periodo a la vez.

    /** Fuente que se está viendo en móvil; conserva la elección del usuario. */
    mobileSourceKey = linkedSignal<SourceView[], string | null>({
        source: () => this.sources(),
        computation: (views, previous) => {
            if (previous?.value && views.some(v => v.source.source === previous.value)) {
                return previous.value;
            }
            const fallback = views.find(v => v.selected && v.hasData) ?? views.find(v => v.hasData) ?? views[0];
            return fallback?.source.source ?? null;
        }
    });

    mobileSource = computed<SourceView | null>(() => {
        const views = this.sources();
        return views.find(v => v.source.source === this.mobileSourceKey()) ?? views[0] ?? null;
    });

    /** Periodo visible dentro de la fuente activa; se reinicia al cambiar de fuente. */
    mobilePeriodId = linkedSignal<SourceView | null, string | null>({
        source: () => this.mobileSource(),
        computation: (view, previous) => {
            const periods = view?.source.periods ?? [];
            if (previous?.value && periods.some(p => p.id === previous.value)) {
                return previous.value;
            }
            return periods[0]?.id ?? null;
        }
    });

    mobilePeriod = computed<FinancialPeriod | null>(() => {
        const periods = this.mobileSource()?.source.periods ?? [];
        return periods.find(p => p.id === this.mobilePeriodId()) ?? periods[0] ?? null;
    });

    /** Grupos de filas del balance / estado de resultados (mapean a FinancialPeriod). */
    readonly periodGroups: RowGroup[] = [
        {
            title: 'Activos',
            rows: [
                { label: 'Efectivo y Equivalentes', key: 'cashAndEquivalents' },
                { label: 'Cuentas por Cobrar', key: 'accountsReceivable' },
                { label: 'Inventarios', key: 'inventories' },
                { label: 'Total Activos Corrientes', key: 'totalCurrentAssets' },
                { label: 'Activos Fijos / Propiedad', key: 'fixedAssetsProperty' },
                { label: 'Total Activos No Corrientes', key: 'totalNonCurrentAssets' },
                { label: 'Total Activos', key: 'totalAssets' }
            ]
        },
        {
            title: 'Pasivos',
            rows: [
                { label: 'Obligaciones Financieras Corrientes', key: 'shortTermFinancialLiabilities' },
                { label: 'Proveedores', key: 'suppliers' },
                { label: 'Total Pasivos Corrientes', key: 'totalCurrentLiabilities' },
                { label: 'Obligaciones Financieras No Corrientes', key: 'longTermFinancialLiabilities' },
                { label: 'Total Pasivos No Corrientes', key: 'totalNonCurrentLiabilities' },
                { label: 'Total Pasivos', key: 'totalLiabilities' }
            ]
        },
        {
            title: 'Patrimonio',
            rows: [
                { label: 'Ganancias Acumuladas', key: 'retainedEarnings' },
                { label: 'Patrimonio', key: 'equity' }
            ]
        },
        {
            title: 'Estado de Resultados',
            rows: [
                { label: 'Ingresos Actividad Ordinaria', key: 'ordinaryActivityRevenue' },
                { label: 'Costos de Venta', key: 'costOfSales' },
                { label: 'Utilidad Bruta', key: 'grossProfit' },
                { label: 'Gastos Administrativos', key: 'administrativeExpenses' },
                { label: 'Gastos de Ventas', key: 'sellingExpenses' },
                { label: 'Depreciación', key: 'depreciation' },
                { label: 'Amortización', key: 'amortization' },
                { label: 'Gastos Financieros', key: 'financialExpenses' },
                { label: 'Impuestos', key: 'taxes' },
                { label: 'Utilidad Neta', key: 'netIncome' }
            ]
        }
    ];

    readonly indicatorRows: FieldRow[] = [
        { label: 'Factor de Estabilidad', key: 'stabilityFactor', format: 'ratio' },
        { label: 'EBITDA', key: 'ebitda' },
        { label: 'EBITDA Ajustado', key: 'adjustedEbitda' },
        { label: 'Servicio de Deuda Actual', key: 'currentDebtService' },
        { label: 'Capacidad de Pago Anual', key: 'annualPaymentCapacity' },
        { label: 'Capacidad de Pago Mensual', key: 'monthlyPaymentCapacity' },
        { label: 'Rotación Cuentas por Cobrar', key: 'accountsReceivableTurnover', format: 'days' },
        { label: 'Rotación de Inventario', key: 'inventoryTurnover', format: 'days' },
        { label: 'Rotación de Proveedores', key: 'suppliersTurnover', format: 'days' },
        { label: 'Periodo de Pago a Proveedores', key: 'paymentTimeSuppliers', format: 'days' },
        { label: 'Rotación Cuentas por Pagar', key: 'accountsPayableTurnover', format: 'ratio' }
    ];

    readonly ratioRows: FieldRow[] = [
        { label: 'Capital de Trabajo', key: 'workingCapital' },
        { label: 'Variación de Activos', key: 'assetsVariation', format: 'percent' },
        { label: 'Variación de Pasivos', key: 'liabilitiesVariation', format: 'percent' },
        { label: 'Variación de Patrimonio', key: 'equityVariation', format: 'percent' },
        { label: 'Crecimiento en Ventas', key: 'salesGrowth', format: 'percent' },
        { label: 'Deuda Financiera / EBIT', key: 'financialDebtToEbit', format: 'ratio' },
        { label: 'Deuda Financiera / Ingresos', key: 'financialDebtToRevenue', format: 'ratio' },
        { label: 'Deuda Financiera / Patrimonio', key: 'financialDebtToEquity', format: 'ratio' },
        { label: 'Pasivos / Ingresos', key: 'liabilitiesToRevenue', format: 'ratio' },
        { label: 'Margen Bruto', key: 'grossMargin', format: 'percent' },
        { label: 'Margen EBIT', key: 'ebitMargin', format: 'percent' },
        { label: 'Margen Neto', key: 'netMargin', format: 'percent' },
        { label: 'Margen Operacional', key: 'operationalMargin', format: 'percent' },
        { label: 'Apalancamiento', key: 'leverage', format: 'ratio' },
        { label: 'Prueba Ácida', key: 'acidTest', format: 'ratio' },
        { label: 'Razón Corriente', key: 'currentRatio', format: 'ratio' },
        { label: 'ROA', key: 'roa', format: 'percent' },
        { label: 'ROE', key: 'roe', format: 'percent' }
    ];

    selectSource(source: string): void {
        this.selectedSource.set(source);
    }

    /**
     * Nota aclaratoria para indicadores/ratios cuando la fuente tiene varios
     * periodos: son un único cálculo consolidado, no un valor de un periodo.
     */
    consolidatedLabel(view: SourceView): string {
        const years = (view.source.periods ?? []).map(p => p.fiscalYear).filter(y => y != null);
        if (years.length < 2) return '';
        const list = years.length === 2
            ? years.join(' y ')
            : `${years.slice(0, -1).join(', ')} y ${years[years.length - 1]}`;
        return `Cálculo consolidado con los periodos ${list}`;
    }

    /**
     * Clases del marco de la columna de la fuente seleccionada: bordes primary
     * en los costados del grupo (y arriba/abajo en los extremos de la tabla)
     * más un tinte de fondo. Para fuentes no seleccionadas conserva el
     * separador izquierdo estándar entre grupos.
     */
    sourceCellClasses(view: SourceView, opts: { first?: boolean; last?: boolean; top?: boolean; bottom?: boolean } = {}): string {
        if (!view.selected) {
            return opts.first ? 'border-l border-surface' : '';
        }
        const classes = ['bg-primary-50/40', 'dark:bg-primary-500/5'];
        if (opts.first) classes.push('border-l-2', 'border-l-primary-500');
        if (opts.last) classes.push('border-r-2', 'border-r-primary-500');
        if (opts.top) classes.push('border-t-2', 'border-t-primary-500');
        if (opts.bottom) classes.push('border-b-2', 'border-b-primary-500');
        return classes.join(' ');
    }

    /** Formatea un valor según el tipo de fila para mostrarlo en la tabla. */
    formatValue(value: unknown, format: RowFormat = 'currency'): string {
        if (value === null || value === undefined) return '—';
        const num = Number(value);
        if (isNaN(num)) return String(value);

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0
                }).format(num);
            case 'percent':
                return `${num.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
            case 'days':
                return `${Math.round(num).toLocaleString('es-CO')} días`;
            case 'ratio':
                return num.toLocaleString('es-CO', { maximumFractionDigits: 2 });
            case 'number':
            default:
                return num.toLocaleString('es-CO', { maximumFractionDigits: 2 });
        }
    }

    /** Acceso genérico a una propiedad del periodo/indicador/ratio por su key. */
    getValue(obj: Record<string, unknown> | null | undefined, key: string): unknown {
        return obj ? obj[key] : null;
    }
}
