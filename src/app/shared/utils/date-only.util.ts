/**
 * Fechas de CALENDARIO: las que en la API son columnas `date` sin hora — corte
 * del balance, fecha del estudio, nacimiento, vencimiento del pagaré, vigencia
 * de una bolsa.
 *
 * El problema que resuelve: si la API manda la fecha como instante
 * ("2025-12-31T00:00:00.000Z"), cualquier formateo en el huso del navegador le
 * resta cinco horas en Colombia (UTC−5) y el corte al 31 de diciembre se
 * muestra como 30 de diciembre.
 *
 * Para marcas de tiempo REALES (creación de un registro, un pago) NO uses esto:
 * ahí el huso sí importa y el DatePipe normal es lo correcto.
 */

/**
 * Convierte una fecha de calendario a un Date en el huso LOCAL, sin conversión
 * de husos: el formateador no tiene nada que desplazar y el día sale tal cual
 * vino. Acepta 'YYYY-MM-DD', el ISO completo o un Date.
 *
 * No basta con formatear en 'UTC': eso arregla el caso del instante pero rompe
 * el de la fecha simple ('2025-12-31'), que se interpreta como medianoche LOCAL
 * y en un navegador al este de UTC se correría un día en el otro sentido.
 */
export function toCalendarDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;

    if (typeof value === 'string') {
        // 'YYYY-MM-DD' y también 'YYYY-MM-DDT00:00:00.000Z': los tres primeros
        // números SON la fecha. Lo que venga después es relleno de una columna
        // sin hora y se ignora a propósito, que es justo lo que evita el
        // corrimiento de un día.
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
        if (match) return new Date(+match[1], +match[2] - 1, +match[3]);

        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : fromUtcParts(parsed);
    }

    return isNaN(value.getTime()) ? null : fromUtcParts(value);
}

/** Un Date que representa una fecha sin hora viene en medianoche UTC. */
function fromUtcParts(date: Date): Date {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}
