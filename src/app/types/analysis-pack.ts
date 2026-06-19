export interface AnalysisPackConsumption {
    creditStudyId: string;
    customerId: string;
    customerName: string;
    statusLabel: string;
    studyDate: string;
    createdBy: string;
}

export interface AnalysisPackPaymentEvent {
    date: string;
    epaycoRef: string;
    codResponse: number;
    statusLabel: string;
    responseText: string;
    amount: number;
    currency: string;
}

export interface AnalysisPackOffering {
    name: string;
    quantity: number;
    discountValue: number;
}

export interface AnalysisPackStatus {
    label: string;
    code: string;
}

export interface AnalysisPack {
    id: string;
    companyId: string;
    packOfferingId: string;
    quantityPurchased: number;
    quantityConsumed: number;
    startDate: string;
    endDate: string;
    unitPricePaid: number;
    totalPaid: number;
    currencyCode: string;
    consultationPriceId: string;
    statusId: number;
    epaycoSessionId: string | null;
    epaycoRef: string | null;
    epaycoTransactionId: string | null;
    epaycoFranchise: string | null;
    epaycoCardLast4: string | null;
    epaycoApprovalCode: string | null;
    epaycoResponseReason: string | null;
    paidAt: string | null;
    isTest: boolean;
    paymentToken: string | null;
    createdAt: string;
    updatedAt: string;
    status: AnalysisPackStatus;
    packOffering: AnalysisPackOffering;
    consumptions: AnalysisPackConsumption[];
    paymentEvents: AnalysisPackPaymentEvent[];
}

export interface AnalysisPackMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AnalysisPacksResponse {
    data: AnalysisPack[];
    meta: AnalysisPackMeta;
}
