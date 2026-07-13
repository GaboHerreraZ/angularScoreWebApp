/**
 * Utilidades de formato para moneda y fechas, centralizadas para no repetir
 * `Intl.NumberFormat`/`toLocaleDateString` en cada componente. Locale es-CO.
 */

const LOCALE = 'es-CO';

/**
 * Formatea un valor como moneda (por defecto COP, sin decimales, símbolo angosto).
 * Acepta `number`, `string` numérico o vacío/null.
 *
 * @param value    monto a formatear
 * @param currency código ISO de la moneda (default 'COP')
 * @param fallback texto a devolver cuando el valor es null/undefined/vacío/NaN (default '—')
 *
 * @example
 * formatCurrency(50000000)            // '$ 50.000.000'
 * formatCurrency('300000000')        // '$ 300.000.000'
 * formatCurrency(null)               // '—'
 */
export function formatCurrency(
    value: number | string | null | undefined,
    currency = 'COP',
    fallback = '—'
): string {
    if (value == null || value === '') return fallback;
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return fallback;
    return new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 0
    }).format(n);
}

/**
 * Formatea un monto de forma compacta ($1.2B / $450M / $12K) para ejes de
 * gráficos o KPIs con poco espacio.
 *
 * @param fallback texto a devolver cuando el valor es null/undefined (default '—')
 *
 * @example
 * formatCompactCurrency(45000000)  // '$45.0M'
 * formatCompactCurrency(null)      // '—'
 */
export function formatCompactCurrency(value: number | null | undefined, fallback = '—'): string {
    if (value == null) return fallback;
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

/**
 * Formatea una fecha ISO como `dd/mm/aaaa` tomando las partes de la cadena sin
 * construir un `Date`, para evitar corrimientos por zona horaria.
 *
 * @param fallback texto a devolver cuando la fecha es null/undefined/vacía (default '—')
 *
 * @example
 * formatShortDate('1990-08-24')             // '24/08/1990'
 * formatShortDate('2026-07-11T16:45:12Z')  // '11/07/2026'
 */
export function formatShortDate(iso: string | null | undefined, fallback = '—'): string {
    if (!iso) return fallback;
    const [year, month, day] = iso.split('T')[0].split('-');
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha con el mes escrito completo (ej. '24 de agosto de 1990').
 * Útil para textos de confirmación y vigencias.
 *
 * @param fallback texto a devolver cuando la fecha es null/undefined/vacía (default '—')
 */
export function formatLongDate(dateStr: string | null | undefined, fallback = '—'): string {
    if (!dateStr) return fallback;
    return new Date(dateStr).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Formatea un número entero con separadores de miles (es-CO).
 *
 * @example
 * formatNumber(1030587)  // '1.030.587'
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat(LOCALE).format(value);
}
