export interface ViabilityAlert {
    type: 'success' | 'warning' | 'danger' | 'info';
    message: string;
    dimension: string;
}

export interface PaymentSuggestion {
    type: string;
    description: string;
    paymentAmount: number;
    suggestedTerm: number;
    suggestedCredit: number;
    numberOfPayments: number;
}

export interface ViabilityDimension {
    label: string;
    score: number;
    maxScore: number;
    status: string;
    reason?: string;
    ratio?: number;
    marginPercent?: number;
    realTerm?: number;
    requestedTerm?: number;
    monthlyObligation?: number;
    maxCreditForRequestedTerm?: number;
    suggestions?: PaymentSuggestion[];
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
    requestedCreditLine?: number;
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
    paymentTimeSuppliers?: number;
    maximumPaymentTime?: number;
    averagePaymentTime?: number;
    recommendedTerm?: number;
    recommendedCreditLine?: number;
    viabilityScore?: number;
    viabilityStatus?: string;
    viabilityConditions?: ViabilityConditions;
    aiAnalyses?: AiAnalysisItem[];
    promissoryNotes?: PromissoryNote[];
    status?: {
        id: number;
        label: string;
        code: string;
    };

    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExtractedFinancialData {
    balanceSheetDate: string | null;
    cashAndEquivalents: number | null;
    accountsReceivable1: number | null;
    accountsReceivable2: number | null;
    inventories1: number | null;
    inventories2: number | null;
    totalCurrentAssets: number | null;
    fixedAssetsProperty: number | null;
    totalNonCurrentAssets: number | null;
    shortTermFinancialLiabilities: number | null;
    suppliers1: number | null;
    suppliers2: number | null;
    totalCurrentLiabilities: number | null;
    longTermFinancialLiabilities: number | null;
    totalNonCurrentLiabilities: number | null;
    retainedEarnings: number | null;
    netIncome: number | null;
    ordinaryActivityRevenue: number | null;
    costOfSales: number | null;
    administrativeExpenses: number | null;
    sellingExpenses: number | null;
    depreciation: number | null;
    amortization: number | null;
    financialExpenses: number | null;
    taxes: number | null;
}

export interface PromissoryNote {
    id: number;
    amount: number;
    amountInWords: string;
    signingUrl: string;
    signedDocumentUrl: string | null;
    signedFileStoragePath: string | null;
    sentAt: string;
    signedAt: string | null;
    declinedAt: string | null;
    createdAt: string;
    status: {
        id: number;
        label: string;
        code: string;
    };
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
        code: string;
    };
}
