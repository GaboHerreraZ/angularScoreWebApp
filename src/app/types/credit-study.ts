export interface ViabilityAlert {
    type: 'success' | 'warning' | 'danger' | 'info';
    message: string;
    dimension: string;
}

export interface ViabilityDimension {
    label: string;
    score: number;
    maxScore: number;
    status: string;
    ratio?: number;
    marginPercent?: number;
    realTerm?: number;
    requestedTerm?: number;
}

export interface ViabilitySummary {
    status: string;
    totalScore: number;
    maxScore: number;
    recommendedTerm: number;
    recommendedCreditLine: number;
    monthlyPaymentCapacity: number;
    annualPaymentCapacity: number;
}

export interface ViabilityConditions {
    alerts: ViabilityAlert[];
    summary: ViabilitySummary;
    dimensions: Record<string, ViabilityDimension>;
}

export interface CreateCreditStudy {
    id: string;
    requestedTerm?: number;
    requestedMonthlyCreditLine?: number;
    customerId: string;
    studyDate: Date | null;
    notes?: string;
    cashAndEquivalents?: number;
    accountsReceivable1?: number;
    accountsReceivable2?: number;
    balanceSheetDate?: Date;
    inventories1?: number;
    inventories2?: number;
    totalCurrentAssets?: number;
    fixedAssetsProperty?: number;
    totalNonCurrentAssets?: number;
    shortTermFinancialLiabilities?: number;
    suppliers1?: number;
    suppliers2?: number;
    totalCurrentLiabilities?: number;
    longTermFinancialLiabilities?: number;
    totalNonCurrentLiabilities?: number;
    retainedEarnings?: number;
    incomeStatementId?: number;
    ordinaryActivityRevenue?: number;
    costOfSales?: number;
    administrativeExpenses?: number;
    sellingExpenses?: number;
    depreciation?: number;
    amortization?: number;
    financialExpenses?: number;
    taxes?: number;
    totalAssets?: number;
    totalLiabilities?: number;
    equity?: number;
    netIncome?: number;
    grossProfit?: number;
    statusId: number;
    resolutionDate?: string;
    stabilityFactor?: number;
    ebitda?: number;
    adjustedEbitda?: number;
    currentDebtService?: number;
    annualPaymentCapacity?: number;
    monthlyPaymentCapacity?: number;
    accountsReceivableTurnover?: number;
    inventoryTurnover?: number;
    suppliersTurnover?: number;
    maximumPaymentTime?: number;
    averagePaymentTime?: number;
    recommendedTerm?: number;
    recommendedCreditLine?: number;
    viabilityScore?: number;
    viabilityStatus?: string;
    viabilityConditions?: ViabilityConditions;
    aiAnalyses?: AiAnalysisItem[];

    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AiAnalysisItem {
    id: string;
    result: string | null;
    createdAt: string;
    performedByUser: {
        id: string;
        name: string;
        lastName: string;
    };
}

export interface AiAnalysisResponse {
    id: string;
    result: string;
    status: 'success' | 'error';
    durationMs: number;
    companyId: string;
    customerId: string;
    creditStudyId: string;
    performedBy: string;
    createdAt: string;
    errorMessage: string | null;
    customer: {
        id: string;
        businessName: string;
    };
    creditStudy: {
        id: string;
        viabilityScore: number;
        viabilityStatus: string;
    };
    performedByUser: {
        id: string;
        name: string;
        lastName: string;
        email: string;
    };
}

export interface CustomerCreditStudyResponse extends CreateCreditStudy {
    status: {
        id: number;
        label: string;
        key: string;
    };
}
