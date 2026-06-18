import { Component, computed, input, output } from '@angular/core';
import { PackOffering } from '@/app/types/onboarding';

/**
 * Tarjeta reutilizable para un pack de consultas. Es seleccionable: al
 * marcarse se resalta con un anillo y una leve escala. Muestra el ahorro
 * cuando el pack trae descuento.
 *
 * @example
 * ```html
 * <app-pack-card
 *     [pack]="pack"
 *     [selected]="selectedId() === pack.id"
 *     (select)="selectedId.set($event.id)"
 * />
 * ```
 */
@Component({
    selector: 'app-pack-card',
    standalone: true,
    templateUrl: './pack-card.html'
})
export class PackCard {
    pack = input.required<PackOffering>();
    selected = input<boolean>(false);

    select = output<PackOffering>();

    /** True si el pack tiene un descuento aplicado. */
    hasDiscount = computed(() => this.pack().discountAmount > 0);

    /** Porcentaje de ahorro respecto al subtotal, redondeado. */
    discountPercent = computed(() => {
        const p = this.pack();
        if (p.subtotal <= 0 || p.discountAmount <= 0) return 0;
        return Math.round((p.discountAmount / p.subtotal) * 100);
    });

    onSelect(): void {
        this.select.emit(this.pack());
    }

    formatCurrency(value: number, currency = 'COP'): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency,
            currencyDisplay: 'narrowSymbol',
            maximumFractionDigits: 0
        }).format(value);
    }
}
