import { Parameter } from "./parameter";

export interface Subscription {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isMonthly: boolean;
    startDate: string;
    endDate: string;
    maxUsers: number;
    maxCompanies: number;
    maxCustomers: number;
    maxStudiesPerMonth: number;
    maxAiAnalysisPerMonth: number | null;
    maxPdfExtractionsPerMonth: number | null;
    dashboardLevel: Parameter;
    excelReports: boolean;
    emailNotifications: boolean;
    themeCustomization: boolean;
    supportLevel: Parameter;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UsageItem {
    used: number;
    max: number;
    remaining: number | null;
    unlimited?: boolean;
}

export interface SubscriptionUsage {
    subscription: Subscription;
    usage: {
        users: UsageItem;
        customers: UsageItem;
        studiesThisMonth: UsageItem;
        aiAnalysesThisMonth: UsageItem;
        pdfExtractionsThisMonth: UsageItem;
    };
    features: {
        dashboardLevel: Parameter;
        excelReports: boolean;
        emailNotifications: boolean;
        themeCustomization: boolean;
        supportLevel: Parameter
    };
}

export interface PlanItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    isMonthly: boolean;
    maxUsers: number;
    maxCompanies: number;
    maxCustomers: number | null;
    maxStudiesPerMonth: number | null;
    maxAiAnalysisPerMonth: number | null;
    maxPdfExtractionsPerMonth: number | null;
    dashboardLevel?: Parameter;
    dashboardLevelId?: number;
    excelReports: boolean;
    emailNotifications: boolean;
    themeCustomization: boolean;
    supportLevel?: Parameter;
    supportLevelId?: number;
    epaycoPlanId: string | null;
    isActive: boolean;
    isCurrent?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    discount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PublicPlansResponse {
    data: PlanItem[];
    campaign: Campaign | null;
}

export interface AvailablePlans {
    currentSubscriptionId: string;
    plans: PlanItem[];
}

export interface PaymentHistoryItem {
    id: string;
    companySubscriptionId: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    currencyCode: string;
    epaycoRef: string | null;
    epaycoTransactionId: string | null;
    responseCode: number;
    responseMessage: string;
    franchise: string | null;
    approvalCode: string | null;
    createdAt: string;
}

export interface SubscriptionDetails {
    availablePlans: AvailablePlans;
    subscriptionUsage: SubscriptionUsage | null;
    paymentHistory: PaymentHistoryItem[];
}

export interface SubscriptionStatus {
    id: number;
    type: string;
    code: string;
    label: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CardTokenRequest {
    cardNumber: string;
    cardName: string;
    cvc: string;
    expMonth: string;
    expYear: string;
}

export interface BillingInfo {
    name: string;
    lastName: string;
    docType: number;
    docTypeCode: string;
    docNumber: string;
    email: string;
    address: string;
    state: string;
    city: string;
    phone: string;
}

export interface ChangePlanRequest {
    subscriptionId: string;
    card?: CardTokenRequest;
    billing?: BillingInfo;
}
