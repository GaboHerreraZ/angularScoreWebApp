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
    balanceSheet?: number;
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
    depreciationAmortization?: number;
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

    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CustomerCreditStudyResponse extends CreateCreditStudy {
    status: {
        id: number;
        label: string;
        key: string;
    };
}
