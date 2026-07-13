import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreditStudyStep2, FinancialSource } from '@/app/types/credit-study';

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
}

@Component({
    selector: 'app-financial-statements',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './financial-statements.html'
})
export class FinancialStatements {
    step2 = input.required<CreditStudyStep2>();

    private readonly sourceMeta: Record<string, { label: string; icon: string }> = {
        pdf_upload: { label: 'Estados Financieros (PDF)', icon: 'pi pi-file-pdf' },
        datacredito: { label: 'Datacrédito', icon: 'pi pi-database' }
    };

    /** Fuentes con metadata de presentación y bandera de disponibilidad de datos. */
    sources = computed<SourceView[]>(() => {
        return (this.step2()?.sources ?? []).map(source => {
            const meta = this.sourceMeta[source.source] ?? { label: source.source, icon: 'pi pi-server' };
            return {
                source,
                label: meta.label,
                icon: meta.icon,
                hasData: (source.periods?.length ?? 0) > 0
            };
        });
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
