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
}

/** Tarjeta a tokenizar en el backend (nunca se almacena en el front). */
export interface OnboardingPaymentCard {
    cardNumber: string;
    cardName: string;
    cvc: string;
    expMonth: string;
    expYear: string;
}

/** Datos de facturación. docType = id numérico ePayco, docTypeCode = código (CC, CE, NIT…). */
export interface OnboardingPaymentBilling {
    name: string;
    lastName: string;
    docTypeCode: string;
    docType: number;
    docNumber: string;
    email: string;
    address: string;
    state: string;
    city: string;
    phone: string;
}

/** Cuerpo de POST /onboarding-payment/pay (PayOnboardingDto). */
export interface PayOnboardingRequest {
    companySubscriptionId: string;
    token: string;
    card: OnboardingPaymentCard;
    billing: OnboardingPaymentBilling;
}

/** Respuesta 201 del pago. */
export interface PayOnboardingResponse {
    paid: boolean;
    companySubscriptionId: string;
    epaycoSubscriptionId: string;
}
