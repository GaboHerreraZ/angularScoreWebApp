/** Datos de facturación que devuelve el resumen, en modo solo lectura. */
export interface OnboardingPaymentSummaryBilling {
    name: string;
    lastName: string;
    docTypeId: number;
    docNumber: string;
    email: string;
    address: string;
    state: string;
    city: string;
    phone: string;
}

/** Resumen del pago de onboarding (GET /onboarding-payment/summary). */
export interface OnboardingPaymentSummary {
    companyName: string;
    planName: string;
    studiesPerMonth: number;
    maxUsers: number;
    amount: number;
    currency: string;
    isMonthly: boolean;
    paymentFrequency: string;
    startDate: string;
    endDate: string;
    alreadyPaid: boolean;
    /** Datos de facturación precargados; se muestran de solo lectura. */
    billing: OnboardingPaymentSummaryBilling;
}

/** Tarjeta a tokenizar en el backend (nunca se almacena en el front). */
export interface OnboardingPaymentCard {
    cardNumber: string;
    cardName: string;
    cvc: string;
    expMonth: string;
    expYear: string;
}

/**
 * Cuerpo de POST /onboarding-payment/pay (PayOnboardingDto).
 * Los datos de facturación ya no se envían: el backend los toma del resumen.
 */
export interface PayOnboardingRequest {
    companySubscriptionId: string;
    token: string;
    card: OnboardingPaymentCard;
}

/** Respuesta 201 del pago. */
export interface PayOnboardingResponse {
    paid: boolean;
    companySubscriptionId: string;
    epaycoSubscriptionId: string;
}
