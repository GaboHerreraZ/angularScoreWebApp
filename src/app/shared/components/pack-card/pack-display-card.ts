import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PackOffering } from '@/app/types/onboarding';

/**
 * Tarjeta presentacional de un pack de análisis de crédito para el landing. A diferencia
 * de {@link PackCard} (seleccionable, usada en el wizard), esta no maneja estado
 * de selección: muestra el pack y su CTA "Registrarme". Resalta el ahorro cuando
 * el pack trae descuento y permite destacar uno como "más popular".
 *
 * @example
 * ```html
 * <app-pack-display-card [pack]="pack" [featured]="pack.id === popularId" (register)="goToRegister()" />
 * ```
 */
@Component({
    selector: 'app-pack-display-card',
    standalone: true,
    imports: [ButtonModule],
    templateUrl: './pack-display-card.html'
})
export class PackDisplayCard {
    pack = input.required<PackOffering>();
    /** Resalta la tarjeta como la opción destacada. */
    featured = input<boolean>(false);

    /** Se emite cuando el usuario quiere registrarse con este pack. */
    register = output<PackOffering>();

    /** True si el pack tiene un descuento aplicado. */
    hasDiscount = computed(() => this.pack().discountAmount > 0);

    /** Porcentaje de ahorro respecto al subtotal, redondeado. */
    discountPercent = computed(() => {
        const p = this.pack();
        if (p.subtotal <= 0 || p.discountAmount <= 0) return 0;
        return Math.round((p.discountAmount / p.subtotal) * 100);
    });

    /**
     * Precio real por análisis: el total ya con descuento dividido entre la
     * cantidad. El `unitPrice` del backend es el precio de lista, así que no
     * refleja lo que realmente cuesta cada análisis cuando hay descuento.
     */
    effectiveUnitPrice = computed(() => {
        const p = this.pack();
        return p.quantity > 0 ? p.total / p.quantity : p.total;
    });

    onRegister(): void {
        this.register.emit(this.pack());
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
