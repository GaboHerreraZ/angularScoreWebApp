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

export interface ReliabilityFlag {
    severity: 'danger' | 'warning' | 'info';
    category: string;
    title: string;
    detail: string;
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
    reliabilityFlags?: ReliabilityFlag[];
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

// ─── Creación de estudio a partir del bureau (Step 1) ────────────────────────

export interface CreateFromBureauPayload {
    identificationTypeCode: string;
    numeroIdentificacion: string;
    apellidoRazonSocial: string;
    requestedTerm: number;
    requestedCreditLine: number;
}

export interface CreateFromBureauResponse {
    creditStudyId: string;
}

// ─── Perfil del cliente en centrales de riesgo ───────────────────────────────

/** Persona vinculada al cliente (rep. legal, junta, socio, revisor fiscal…). */
export interface BureauPerson {
    documentType: string | null;
    documentNumber: string | null;
    name: string | null;
    lastName: string | null;
    role: string | null;
    appointmentDate: string | null;
    status: string | null;
    participation: string | null;
}

export interface BureauGeneralProfile {
    legalOrganization: string | null;
    legalOrganizationLabel: string | null;
    ciiuCode: string | null;
    economicActivity: string | null;
    employeeCount: string | null;
    employeeRange: string | null;
    seized: string | null;
    seizedLabel: string | null;
    inLiquidation: string | null;
    inLiquidationLabel: string | null;
    incorporationDate: string | null;
    authorizedCapital: string | null;
    subscribedCapital: string | null;
    paidCapital: string | null;
}

export interface BureauRegistration {
    number: string | null;
    chamberOfCommerce: string | null;
    incorporation: string | null;
    lastRenewal: string | null;
    status: string | null;
}

export interface BureauPeopleGroup {
    main: BureauPerson[];
    alternates: BureauPerson[];
}

export interface BureauStatutoryAuditors extends BureauPeopleGroup {
    auditFirm: BureauPerson | null;
}

export interface BureauPartners {
    list: BureauPerson[];
    totalContributions: string | null;
}

export interface BureauContact {
    address: string | null;
    phone: string | null;
    city: string | null;
    email: string | null;
}

export interface BureauProfile {
    generalProfile: BureauGeneralProfile | null;
    registration: BureauRegistration | null;
    legalRep: BureauPeopleGroup | null;
    board: BureauPeopleGroup | null;
    statutoryAuditors: BureauStatutoryAuditors | null;
    partners: BureauPartners | null;
    contact: BureauContact | null;
}

export interface BureauCustomer {
    id: string;
    companyId: string;
    personTypeId: number | null;
    identificationTypeId: number | null;
    businessName: string | null;
    identificationNumber: string | null;
    verificationDigit: string | null;
    personType: {
        id: number;
        code: string;
        label: string;
    } | null;
    firstName: string | null;
    secondName: string | null;
    firstLastName: string | null;
    secondLastName: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    birthDate: string | null;
    birthCity: string | null;
    gender: string | null;
    ageRange: string | null;
    documentStatus: string | null;
    bureauProfile: BureauProfile | null;
    bureauCreated: boolean;
    lastConsultedAt: string | null;
}

export interface CreditStudyStep1 {
    isLegalEntity: boolean;
    customer: BureauCustomer;
}

/** Datos de la solicitud (a nivel raíz del GET /steps). */
export interface CreditStudyRequest {
    requestedTerm: number | null;
    requestedCreditLine: number | null;
}

// ─── Step 2: estados financieros (por fuente y periodo) ──────────────────────

export interface FinancialPeriod {
    id: string;
    fiscalYear: number;
    source: string;
    balanceSheetDate: string | null;
    incomeStatementId: number | null;
    consultationId: string | null;
    analysisId: string | null;
    cashAndEquivalents: number | null;
    accountsReceivable: number | null;
    inventories: number | null;
    totalCurrentAssets: number | null;
    fixedAssetsProperty: number | null;
    totalNonCurrentAssets: number | null;
    totalAssets: number | null;
    shortTermFinancialLiabilities: number | null;
    suppliers: number | null;
    totalCurrentLiabilities: number | null;
    longTermFinancialLiabilities: number | null;
    totalNonCurrentLiabilities: number | null;
    totalLiabilities: number | null;
    retainedEarnings: number | null;
    equity: number | null;
    ordinaryActivityRevenue: number | null;
    costOfSales: number | null;
    grossProfit: number | null;
    administrativeExpenses: number | null;
    sellingExpenses: number | null;
    depreciation: number | null;
    amortization: number | null;
    financialExpenses: number | null;
    taxes: number | null;
    netIncome: number | null;
}

export interface FinancialIndicators {
    stabilityFactor: number | null;
    ebitda: number | null;
    adjustedEbitda: number | null;
    currentDebtService: number | null;
    annualPaymentCapacity: number | null;
    monthlyPaymentCapacity: number | null;
    accountsReceivableTurnover: number | null;
    inventoryTurnover: number | null;
    suppliersTurnover: number | null;
    paymentTimeSuppliers: number | null;
    accountsPayableTurnover: number | null;
}

export interface FinancialRatios {
    workingCapital: number | null;
    assetsVariation: number | null;
    liabilitiesVariation: number | null;
    equityVariation: number | null;
    salesGrowth: number | null;
    financialDebtToEbit: number | null;
    financialDebtToRevenue: number | null;
    financialDebtToEquity: number | null;
    liabilitiesToRevenue: number | null;
    grossMargin: number | null;
    ebitMargin: number | null;
    netMargin: number | null;
    operationalMargin: number | null;
    leverage: number | null;
    acidTest: number | null;
    currentRatio: number | null;
    roa: number | null;
    roe: number | null;
}

export interface FinancialSource {
    source: string;
    analysisId: string | null;
    periods: FinancialPeriod[];
    indicators: FinancialIndicators | null;
    ratios: FinancialRatios | null;
    reliabilityFlags: ReliabilityFlag[] | null;
}

export interface CreditStudyStep2 {
    sources: FinancialSource[];
}

export interface ExtractFinancialStatementsResponse {
    success: boolean;
    sources: {
        pdf?: { periods: number };
        datacredito?: { periods: number };
        [key: string]: { periods: number } | undefined;
    };
}

export interface CreditStudyStepsResponse {
    creditStudyId: string;
    status: {
        id: number;
        type: string;
        code: string;
        label: string;
        parentId: number | null;
        isActive: boolean;
    };
    studyDate: string | null;
    request: CreditStudyRequest | null;
    step1: CreditStudyStep1 | null;
    step2: CreditStudyStep2 | null;
    step3: PerformStudyResponse | null;
}

// ─── Step 3: resultado del análisis (POST /perform) ──────────────────────────

export type ScoringStatus = 'approved' | 'conditional' | 'rejected';
export type CalculationSource = 'datacredito' | 'pdf' | 'none';

export interface ScoringDimension {
    dimension: string;
    label: string;
    ratio: number | null;
    weight: number;
    contribution: number;
    status: string;
    evaluable: boolean;
}

export interface ScoringSummary {
    totalScore: number;
    maxScore: number;
    status: ScoringStatus;
    calculationSource: CalculationSource;
    financialsVerified: boolean;
    eliminatoryReason?: string | null;
}

export interface ApprovedCreditLine {
    amount: number;
    requested: number;
    suggestedByBureau: number | null;
    cappedByBureau: boolean;
}

export interface ScoringReference {
    experianScore: number | null;
    experianSuggestedAmount: number | null;
    experianRiskLevel: string | null;
}

export interface ScoringAlert {
    type: 'success' | 'warning' | 'danger' | 'info';
    dimension: string;
    message: string;
}

export interface ScoringKeyFigures {
    ebitda: number | null;
    stabilityFactor: number | null;
    inventoryTurnover: number | null;
    currentDebtService: number | null;
    cashConversionCycle: number | null;
    paymentCoverageRatio: number | null;
    paymentTimeSuppliers: number | null;
    annualPaymentCapacity: number | null;
    estimatedMonthlyQuota: number | null;
    monthlyPaymentCapacity: number | null;
    accountsReceivableTurnover: number | null;
    [key: string]: number | null;
}

export interface ScoringResult {
    summary: ScoringSummary;
    dimensions: Record<string, ScoringDimension>;
    approvedCreditLine: ApprovedCreditLine;
    reference: ScoringReference;
    alerts: ScoringAlert[];
    keyFigures?: ScoringKeyFigures | null;
    /** Capa 1: fiabilidad del documento (PDF contra sí mismo). */
    pdfReliabilityFlags: ReliabilityFlag[];
    /** Capa 2: señales de la central de riesgo. */
    centralRiskFlags: ReliabilityFlag[];
}

export interface PerformStudyResponse {
    id?: string;
    viabilityScore: number;
    viabilityStatus: ScoringStatus;
    recommendedCreditLine: number;
    recommendedTerm: number;
    resolutionDate: string;
    scoringConfigurationId?: string | null;
    customer?: {
        id?: string;
        businessName?: string;
        identificationNumber?: string;
        city?: string;
        personType?: { code: string; label: string; description?: string };
        [key: string]: unknown;
    };
    status?: {
        id: number;
        label: string;
        code: string;
    };
    /** Resultado del scoring (nuevo nombre de la propiedad). */
    result: ScoringResult;
    /** Análisis IA ya generado para este estudio (solo uno por estudio). */
    aiAnalysis?: StudyAiAnalysis | null;
    aiAnalyses?: AiAnalysisItem[];
    requestedCreditLine?: number;
    requestedTerm?: number;
    studyDate?: Date | null;
}

/** Análisis IA embebido en el estudio (shape reducido del GET /steps y del POST). */
export interface StudyAiAnalysis {
    id: string;
    result: string;
    model?: string | null;
    status?: 'success' | 'error';
    durationMs?: number;
    createdAt: string;
    performedBy?: string;
    performedByUser?: {
        id: string;
        name: string;
        lastName: string;
        email?: string;
    };
}
