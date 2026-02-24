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
    dashboardLevel: Parameter
    excelReports: boolean;
    emailNotifications: boolean;
    themeCustomization: boolean;
    supportLevel:Parameter
    isActive: boolean;
    isCurrent?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AvailablePlans {
    currentSubscriptionId: string;
    plans: PlanItem[];
}

export interface CreateTransactionRequest {
    subscriptionId: string;
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

export interface CompanySubscription {
    id: string;
    companyId: string;
    subscriptionId: string;
    statusId: number;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    paymentFrequency: string;
    pricePaid: number;
    cancelledAt: string | null;
    paymentId: string;
    integrityHash: string;
    amountInCents: number;
    createdAt: string;
    updatedAt: string;
    subscription: Subscription;
    status: SubscriptionStatus;
    company: {
        id: string;
        name: string;
        nit: string;
        sectorId: number;
        subscriptionId: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
}
