import { Component, computed, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PackOffering } from '@/app/types/onboarding';
import { formatCurrency } from '@/app/shared/utils/format.util';

/**
 * Tarjeta de un pack de análisis de crédito. Es la única tarjeta de packs de la
 * aplicación: se usa igual en el landing, en administración y en el wizard de
 * onboarding, siempre dentro de un {@link CardCarousel}.
 *
 * El CTA se adapta con `ctaLabel` ("Lo quiero", "Comprar", "Elegir"…) y, cuando
 * la pantalla necesita que el usuario escoja uno entre varios, `selected` marca
 * el elegido. Resalta el ahorro cuando el pack trae descuento y permite destacar
 * uno como "más popular" con `featured`.
 *
 * @example
 * ```html
 * <!-- Landing: solo presenta -->
 * <app-pack-display-card [pack]="pack" [featured]="pack.id === popularId" (register)="goToRegister()" />
 *
 * <!-- Wizard: el usuario elige uno -->
 * <app-pack-display-card [pack]="pack" [selected]="selectedId() === pack.id" ctaLabel="Elegir" (register)="select($event)" />
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
    /** Resalta la tarjeta como la opción destacada ("Más elegido"). */
    featured = input<boolean>(false);
    /**
     * Marca esta tarjeta como la elegida por el usuario. Solo aplica donde hay
     * que escoger un pack entre varios, como el wizard de onboarding; en el
     * landing y en el catálogo de administración se deja en false.
     */
    selected = input<boolean>(false);
    /** Texto del botón de acción. Por defecto, el CTA del landing. */
    ctaLabel = input<string>('Lo quiero');

    /** Se emite cuando el usuario acciona el CTA de este pack. */
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

    /** El borde resaltado lo activa tanto la tarjeta destacada como la elegida. */
    highlighted = computed(() => this.featured() || this.selected());

    onRegister(): void {
        this.register.emit(this.pack());
    }

    formatCurrency = formatCurrency;
}
