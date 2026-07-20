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
    state: string;
    city: string;
    address: string;
}

/** Datos de facturación. Se derivan de perfil + empresa. POST /api/onboarding → billing. */
export interface OnboardingBilling {
    billingName: string;
    billingLastName: string;
    billingDocTypeId: number;
    billingDocNumber: string;
    billingEmail: string;
    billingPhone: string;
    billingAddress: string;
    billingState: string;
    billingCity: string;
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

/** Respuesta 200 de GET /api/onboarding/:profileId (onboarding ya existente). */
export interface OnboardingByProfile {
    profileId: string;
    companyId: string;
    profile: OnboardingProfile;
    company: OnboardingCompany;
    billing: OnboardingBilling;
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
    total: number;
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

/** Respuesta de la compra: trae el sessionId para abrir el checkout de ePayco. */
export interface PurchasePackResponse {
    analysisPackId: string;
    invoice: string;
    sessionId: string;
    pricing: {
        quantity: number;
        unitPrice: number;
        subtotal: number;
        discountAmount: number;
        total: number;
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
    invoice: string;
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
        currency: string;
        providerReference: string;
        providerTransactionId: string;
    };
    validity: {
        startDate: string;
        endDate: string;
    };
}
