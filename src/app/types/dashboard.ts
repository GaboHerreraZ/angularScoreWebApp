export interface KpiValue {
    value: number;
    previous: number;
    delta: number;
    deltaPercent: number | null;
}

export interface DashboardSummary {
    totalCustomers: KpiValue;
    totalStudies: KpiValue;
    studiesThisMonth: KpiValue;
    activeUsers: KpiValue;
}

export interface DashboardCreditSummary {
    totalRequestedThisMonth: KpiValue;
    avgRequestedThisMonth: KpiValue;
    avgRequestedTerm: KpiValue;
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
    requestedCreditLine: number;
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
    avgEbitda: KpiValue;
    avgMonthlyPaymentCapacity: KpiValue;
    avgStabilityFactor: KpiValue;
    avgPaymentTimeSuppliers: KpiValue;
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
    accountsReceivableTurnover: KpiValue;
    inventoryTurnover: KpiValue;
    suppliersTurnover: KpiValue;
    paymentTimeSuppliers: KpiValue;
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
    avgCurrentLiabilities: KpiValue;
    avgNonCurrentLiabilities: KpiValue;
    avgEquity: KpiValue;
    debtToEquityRatio: KpiValue;
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
