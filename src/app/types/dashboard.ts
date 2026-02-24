export interface DashboardSummary {
    totalCustomers: number;
    totalStudies: number;
    studiesThisMonth: number;
    activeUsers: number;
}

export interface DashboardCreditSummary {
    totalRequestedThisMonth: number;
    avgRequestedThisMonth: number;
    avgRequestedTerm: number;
}

export interface StudyByStatus {
    statusId: number;
    label: string;
    count: number;
}

export interface StudyByMonth {
    month: string;
    count: number;
}

export interface CustomerByPersonType {
    personTypeId: number;
    label: string;
    count: number;
}

export interface RecentStudy {
    id: string;
    customerName: string;
    studyDate: string;
    statusLabel: string;
    requestedMonthlyCreditLine: number;
}

export interface BasicDashboard {
    summary: DashboardSummary;
    creditSummary: DashboardCreditSummary;
    studiesByStatus: StudyByStatus[];
    studiesByMonth: StudyByMonth[];
    customersByPersonType: CustomerByPersonType[];
    recentStudies: RecentStudy[];
}

// Advanced-only fields
export interface FinancialIndicators {
    avgEbitda: number;
    avgMonthlyPaymentCapacity: number;
    avgStabilityFactor: number;
    avgMaxPaymentTime: number;
}

export interface StabilityBand {
    band: string;
    count: number;
}

export interface PaymentCapacityTrendItem {
    month: string;
    value: number;
}

export interface AvgTurnoverIndicators {
    accountsReceivableTurnover: number;
    inventoryTurnover: number;
    suppliersTurnover: number;
    maximumPaymentTime: number;
}

export interface TopCustomerByCredit {
    customerId: string;
    businessName: string;
    totalCredit: number;
    studiesCount: number;
}

export interface RevenueVsNetIncomeItem {
    month: string;
    avgRevenue: number;
    avgNetIncome: number;
}

export interface AvgDebtStructure {
    avgCurrentLiabilities: number;
    avgNonCurrentLiabilities: number;
    avgEquity: number;
    debtToEquityRatio: number;
}

export interface StudyByAnalyst {
    analystId: string;
    analystName: string;
    count: number;
}

export interface CustomerByEconomicActivity {
    economicActivityId: number;
    label: string;
    count: number;
}

export interface AdvancedDashboard extends BasicDashboard {
    financialIndicators: FinancialIndicators;
    stabilityDistribution: StabilityBand[];
    paymentCapacityTrend: PaymentCapacityTrendItem[];
    avgTurnoverIndicators: AvgTurnoverIndicators;
    topCustomersByCredit: TopCustomerByCredit[];
    revenueVsNetIncome: RevenueVsNetIncomeItem[];
    avgDebtStructure: AvgDebtStructure;
    studiesByAnalyst: StudyByAnalyst[];
    customersByEconomicActivity: CustomerByEconomicActivity[];
}

export type DashboardLevel = 'basic' | 'advanced' | 'premium';
