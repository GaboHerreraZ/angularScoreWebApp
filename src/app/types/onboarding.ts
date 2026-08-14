/** Tipos del flujo de onboarding (registro de perfil + empresa + compra de pack). */

/** Datos personales del usuario (paso 1). POST /api/onboarding → profile. */
export interface OnboardingProfile {
    name: string;
    lastName: string;
    phone: string;
    identificationTypeId: number;
    identificationNumber: string;
    position: string;
}

/** Datos de la empresa (paso 2). POST /api/onboarding → company. */
export interface OnboardingCompany {
    name: string;
    nit: string;
    sectorId: number;
    cityCode: string;
    address: string;
}

/** Datos de facturación. Se derivan de perfil + empresa. POST /api/onboarding → billing. */
export interface OnboardingBilling {
    /** Persona natural. Vacío cuando el documento es NIT. */
    billingName: string;
    billingLastName: string;
    /** Persona jurídica. Vacío salvo que el documento sea NIT. */
    billingBusinessName: string;
    billingDocTypeId: number;
    billingDocNumber: string;
    billingEmail: string;
    billingPhone: string;
    billingAddress: string;
    billingCityCode: string;
    billingRegimeTypeId: number;
    /** Codes de Parameter 'fiscal_responsibility' (son los codigos DIAN). */
    billingFiscalResponsibilities: string[];
}

/** Cuerpo de POST /api/onboarding. */
export interface OnboardingRequest {
    profile: OnboardingProfile;
    company: OnboardingCompany;
    billing: OnboardingBilling;
}

/** Respuesta 201 de POST /api/onboarding. */
export interface OnboardingResponse {
    profileId: string;
    companyId: string;
    userCompanyId: string;
}

/**
 * Respuesta 200 de GET /api/onboarding/:profileId (onboarding ya existente).
 * Sobre lo que se envía al crear, añade el municipio y el departamento ya
 * resueltos: el resumen los pinta sin volver a consultar el catálogo.
 */
export interface OnboardingByProfile {
    profileId: string;
    companyId: string;
    profile: OnboardingProfile;
    company: OnboardingCompany & { city: string; state: string };
    billing: OnboardingBilling & { billingCity: string | null; billingState: string | null };
}

/** Datos ya aplanados que muestran las tarjetas del resumen de compra. */
export interface PurchaseProfileSummary {
    name: string;
    position: string;
    docNumber: string;
    phone: string;
}

export interface PurchaseCompanySummary {
    name: string;
    nit: string;
    address: string;
    location: string;
}

export interface PurchaseBillingSummary {
    name: string;
    docNumber: string;
    email: string;
    phone: string;
    address: string;
    location: string;
}

/** Pack de consultas disponible. GET /api/pack-offerings/catalog. */
export interface PackOffering {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    validityDays: number;
    sortOrder: number;
    currency: string;
    unitPrice: number;
    subtotal: number;
    discountAmount: number;
    /** Valor comercial del pack (con descuento por volumen, sin IVA sumado). */
    total: number;
    /**
     * Desglose de IVA con la tarifa vigente: base + amount = totalToCharge.
     * null si no hay precio de consulta activo (catálogo no cotizable).
     */
    tax: {
        /** Tarifa aplicada (19 = 19%). */
        rate: number;
        /** true = `total` YA incluye el IVA. */
        included: boolean;
        base: number;
        amount: number;
    } | null;
    /**
     * Lo que se le cobrará al cliente: igual a `total` si el IVA va incluido,
     * o total + IVA si no. Es el número a mostrar como "total a pagar".
     * Si el usuario aplica un código promocional, el desglose definitivo lo
     * devuelve /purchase (el descuento entra antes del impuesto).
     */
    totalToCharge: number;
}

/**
 * Resultado de validar un código promocional antes de pagar.
 * GET /api/companies/:companyId/promo-codes/validate?code=...
 * Siempre responde 200: `valid` indica el resultado de negocio.
 */
export interface PromoCodeValidation {
    valid: boolean;
    /** Solo presentes cuando `valid` es true. */
    promoCodeId?: string;
    code?: string;
    /** Porcentaje de descuento (número, p. ej. 15) cuando `valid` es true. */
    discountPercent?: number;
    /** Motivo del rechazo cuando `valid` es false. */
    reason?: string;
}

/** Cuerpo de POST /api/companies/:companyId/analysis-packs/purchase. */
export interface PurchasePackRequest {
    packOfferingId: string;
    redirectPath?: string;
    /** Código promocional a re-validar y canjear al confirmar el pago. */
    promoCode?: string;
}

/**
 * Respuesta de la compra. Normalmente trae el sessionId para abrir el checkout
 * de ePayco; si un código promocional cubre el 100%, la compra es SIN COSTO:
 * `requiresPayment` viene en false, la bolsa ya queda activa y no hay checkout
 * ni factura que abrir (`sessionId` e `invoice` en null).
 */
export interface PurchasePackResponse {
    analysisPackId: string;
    /** Referencia de cobro; null en compras sin costo (no se factura nada). */
    invoice: string | null;
    /** Sesión del checkout de ePayco; null en compras sin costo. */
    sessionId: string | null;
    /** False = la bolsa ya quedó activa, no hay que abrir la pasarela. */
    requiresPayment: boolean;
    /** Estado en que quedó la bolsa: 'pending_payment' o 'active' (sin costo). */
    status: AnalysisPackStatus;
    pricing: {
        quantity: number;
        unitPrice: number;
        subtotal: number;
        discountAmount: number;
        /** Total con descuento por volumen, ANTES del código promocional. */
        total: number;
        /** Código promocional aplicado; null si no se envió ninguno. */
        promoCode: {
            code: string;
            discountPercent: number;
            discountAmount: number;
        } | null;
        /** Desglose de IVA de lo cobrado: base + amount = totalToCharge. */
        tax: {
            /** Tarifa aplicada (19 = 19%). */
            rate: number;
            /** true = el precio del catálogo ya incluía el IVA. */
            included: boolean;
            base: number;
            amount: number;
        };
        /** Lo que realmente se cobra (0 en una compra sin costo). */
        totalToCharge: number;
        currency: string;
    };
    validity: {
        startDate: string;
        endDate: string;
    };
}

/** Estado del pack tras el pago. */
export type AnalysisPackStatus = 'active' | 'pending_payment' | 'cancelled' | string;

/** Detalle del pack consultado por referencia de ePayco (GET /analysis-packs/by-reference/:refPayco). */
export interface AnalysisPackByReference {
    analysisPackId: string;
    status: AnalysisPackStatus;
    statusLabel: string;
    /** Referencia de cobro; null si la bolsa se entregó sin costo. */
    invoice: string | null;
    company: {
        id: string;
        name: string;
        nit: string;
    };
    plan: {
        packOfferingId: string;
        name: string;
        description: string | null;
        consultations: number;
        validityDays: number;
    };
    payment: {
        unitPrice: number;
        subtotal: number;
        discountAmount: number;
        total: number;
        /** True = bolsa entregada sin cobro (código del 100%): no hay factura. */
        isFree: boolean;
        /** Desglose fiscal congelado al comprar: base + amount = total. */
        tax: {
            rate: number;
            base: number;
            amount: number;
        };
        currency: string;
        providerReference: string;
        providerTransactionId: string;
    };
    validity: {
        startDate: string;
        endDate: string;
    };
}
