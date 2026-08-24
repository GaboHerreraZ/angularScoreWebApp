import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { toCalendarDate } from '@/app/shared/utils/date-only.util';

/**
 * Formatea fechas de CALENDARIO — las que en la API son columnas `date` sin
 * hora: corte del balance, fecha del estudio, nacimiento, vencimiento del
 * pagaré, vigencia de una bolsa.
 *
 * Por qué no sirve el `date` de Angular a secas: si la API manda la fecha como
 * instante ("2025-12-31T00:00:00.000Z"), el DatePipe la convierte al huso del
 * navegador. En Colombia (UTC−5) eso resta cinco horas y el corte al 31 de
 * diciembre se muestra como 30 de diciembre.
 *
 * La regla de conversión vive en date-only.util para poder usarla también desde
 * TypeScript (comparar fechas, inicializar un datepicker) sin duplicarla.
 *
 * Para marcas de tiempo REALES (creación de un registro, un pago) NO uses este
 * pipe: ahí el huso sí importa y el `date` normal es lo correcto.
 */
@Pipe({
    name: 'dateOnly',
    standalone: true
})
export class DateOnlyPipe implements PipeTransform {
    private readonly locale = inject(LOCALE_ID);

    transform(value: string | Date | null | undefined, format = 'dd/MM/yyyy'): string {
        const date = toCalendarDate(value);
        return date ? formatDate(date, format, this.locale) : '';
    }
}
