/**
 * Cálculo del desglose de cobro de un pack de análisis (descuentos + IVA).
 * Vive aparte porque el wizard de onboarding y la compra desde administración
 * muestran exactamente el mismo resumen y deben coincidir con el backend.
 */

import { PackOffering } from '@/app/types/onboarding';

/** Desglose que se muestra en el resumen de compra. */
export interface PackPricing {
    /** Precio de lista (cantidad × precio unitario), antes de descuentos. */
    subtotal: number;
    /** Descuento por volumen que ya trae el catálogo. */
    volumeDiscount: number;
    /** Valor comercial con el descuento por volumen aplicado. */
    total: number;
    /** Pesos que descuenta el código promocional (0 si no hay código). */
    promoDiscount: number;
    /** Tarifa de IVA aplicada (19 = 19%). 0 si el catálogo no trae impuesto. */
    taxRate: number;
    /** true = los precios del catálogo YA incluyen el IVA. */
    taxIncluded: boolean;
    /** Base gravable del cobro. */
    taxBase: number;
    /** IVA del cobro. */
    taxAmount: number;
    /** Lo que realmente se cobra: taxBase + taxAmount. */
    totalToCharge: number;
}

const EMPTY: PackPricing = {
    subtotal: 0,
    volumeDiscount: 0,
    total: 0,
    promoDiscount: 0,
    taxRate: 0,
    taxIncluded: false,
    taxBase: 0,
    taxAmount: 0,
    totalToCharge: 0
};

/**
 * Arma el desglose de lo que se le va a cobrar al cliente por un pack.
 *
 * Sin código promocional se reusan tal cual las cifras del catálogo, para que
 * lo mostrado sea idéntico a lo que cobrará el backend. Con código, el descuento
 * entra ANTES del impuesto (igual que en /purchase) y el IVA se recalcula sobre
 * el nuevo valor: si el precio ya trae el IVA dentro se despeja la base, y si no,
 * el impuesto se suma encima.
 *
 * @param pack            pack elegido; null devuelve un desglose en ceros
 * @param discountPercent porcentaje del código promocional aplicado (0 si no hay)
 *
 * @example
 * packPricing(pack)      // { total: 99998, taxBase: 84032, taxAmount: 15966, totalToCharge: 99998 }
 * packPricing(pack, 100) // compra sin costo: todo en 0 salvo el descuento
 */
export function packPricing(pack: PackOffering | null | undefined, discountPercent = 0): PackPricing {
    if (!pack) return EMPTY;

    const rate = pack.tax?.rate ?? 0;
    const included = pack.tax?.included ?? false;

    // Sin código promocional el backend ya nos dio el desglose definitivo.
    if (discountPercent <= 0) {
        return {
            subtotal: pack.subtotal,
            volumeDiscount: pack.discountAmount,
            total: pack.total,
            promoDiscount: 0,
            taxRate: rate,
            taxIncluded: included,
            taxBase: pack.tax?.base ?? pack.totalToCharge,
            taxAmount: pack.tax?.amount ?? 0,
            totalToCharge: pack.totalToCharge
        };
    }

    const totalAfterPromo = Math.round(pack.total * (1 - discountPercent / 100));
    // Con IVA incluido se despeja la base del valor comercial; si no, se suma encima.
    const taxBase = included && rate > 0 ? Math.round(totalAfterPromo / (1 + rate / 100)) : totalAfterPromo;
    const taxAmount = rate > 0 ? (included ? totalAfterPromo - taxBase : Math.round(totalAfterPromo * (rate / 100))) : 0;

    return {
        subtotal: pack.subtotal,
        volumeDiscount: pack.discountAmount,
        total: pack.total,
        promoDiscount: pack.total - totalAfterPromo,
        taxRate: rate,
        taxIncluded: included,
        taxBase,
        taxAmount,
        totalToCharge: taxBase + taxAmount
    };
}

export function packTaxSuffix(pack: PackOffering | null | undefined): string {
    const tax = pack?.tax;
    if (!tax || tax.rate <= 0 || tax.included) return '';
    return '+ IVA';
}


export function packTaxDisclaimer(pack: PackOffering | null | undefined): string {
    const tax = pack?.tax;
    if (!tax || tax.rate <= 0) return '';
    return tax.included
        ? `Los precios ya incluyen IVA (${tax.rate}%)`
        : `Los precios no incluyen IVA (${tax.rate}%): se suma al pagar`;
}
