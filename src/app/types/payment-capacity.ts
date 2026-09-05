/**
 * Tipos del estudio de capacidad de pago (persona natural sin estados
 * financieros). El estudio se evalúa sobre documentos del titular: extractos
 * bancarios + desprendibles de nómina (asalariado) o facturas (independiente).
 * El resultado usa el MISMO shape que el estudio con EEFF (ScoringResult) más
 * el bloque `capacityFigures`, así que el paso 3 reutiliza StudyResult.
 */

import { ReliabilityFlag } from './credit-study';

export type StudyTypeCode = 'financialStatements' | 'paymentCapacity';
export type EmploymentTypeCode = 'salaried' | 'independent';
export type StudyDocumentTypeCode = 'bankStatement' | 'payrollStub' | 'contractorInvoice';
export type ExtractionStatus = 'pending' | 'success' | 'error';

/** Resultado de una validación determinística sobre los documentos (V1–V10). */
export interface DocumentValidation {
    code: string;
    label: string;
    /** null = no evaluable con los datos disponibles (se declara, no penaliza). */
    passed: boolean | null;
    severity: 'danger' | 'warning' | 'info';
    detail: string;
}

/** Documento cargado. `summary` es el resumen chico por tipo (nunca los movimientos). */
export interface StudyDocument {
    id: string;
    documentType: { id: number; code: StudyDocumentTypeCode; label: string };
    fileName: string;
    fileSizeBytes: number;
    extractionStatus: ExtractionStatus;
    extractionError: string | null;
    summary: Record<string, unknown> | null;
    extractionFlags: ReliabilityFlag[] | null;
    validationResults: DocumentValidation[] | null;
    periodFrom: string | null;
    periodTo: string | null;
    accountLast4: string | null;
    createdAt: string;
}

/** Cobertura de la ventana exigida: la unidad es el MES, no el archivo. */
export interface DocumentCoverage {
    requiredMonths: number;
    coveredMonths: number;
    /** Meses cubiertos (YYYY-MM), ordenados. */
    months: string[];
    lastPeriodTo: string | null;
    recencyOk: boolean | null;
    payrollStubs: number;
    contractorInvoices: number;
    incomeDocOk: boolean;
    /** true cuando ya se puede realizar el estudio. */
    complete: boolean;
}

export interface MonthlyIncomePoint {
    month: string;
    income: number;
    deposits: number;
}

/** Total pagado a una contraparte en un mes de la ventana (0 incluido). */
export interface ObligationMonth {
    month: string;
    amount: number;
}

export interface DetectedObligation {
    kind: 'loan' | 'card' | 'probable_installment' | string;
    /** Etiqueta tal cual la escribe el banco: tiene que poder buscarse en el PDF. */
    counterparty: string;
    /** Opcionales: los estudios realizados antes de este desglose no los traen. */
    source?: 'statement' | 'payrollStub' | string;
    /** Suma de los pagos del período — la cifra que aparece en el extracto. */
    totalAmount?: number;
    paymentCount?: number;
    /** Total mes a mes de la ventana, meses en cero incluidos. */
    monthlyTotals?: ObligationMonth[];
    /** totalAmount ÷ meses de la ventana. */
    monthlyAverage: number;
    confidence: 'high' | 'medium' | string;
    /** Meses (YYYY-MM) de la ventana en los que aparece. */
    months: string[];
    /** Explicación de qué es y cómo debe leerse. */
    detail: string;
}

export interface CapacityBehavior {
    averageBalance: number | null;
    minBalance: number | null;
    daysNegative: number;
    daysAtZero: number;
    /** Proporción del ingreso retirada en las 48h siguientes al abono. */
    pctWithdrawn48h: number | null;
    gamblingMonthlyAvg: number;
    gamblingPctOfIncome: number | null;
    walletTransfersMonthlyAvg: number;
    walletTransfersCount: number;
    cardCashInTotal: number;
    /** El backend adjunta además el detalle de nómina y el cruce de facturas. */
    [key: string]: unknown;
}

/** Análisis persistido tras realizar el estudio (1:1 con el estudio). */
export interface PaymentCapacityAnalysis {
    id: string;
    verifiedMonthlyIncome: number | null;
    payrollNetIncome: number | null;
    bankStatementIncome: number | null;
    incomeVerificationIndex: number | null;
    incomeCv: number | null;
    monthsWithIncome: number | null;
    windowMonths: number | null;
    coveredMonths: number | null;
    paysOwnSocialSecurity: boolean;
    verifiedHireDate: string | null;
    recurringFixedExpenses: number | null;
    existingDebtPayments: number | null;
    availableIncome: number | null;
    maxSuggestedInstallment: number | null;
    payrollLoanCapacity: number | null;
    currentDti: number | null;
    projectedDti: number | null;
    behavior: CapacityBehavior | null;
    monthlyIncomeSeries: MonthlyIncomePoint[] | null;
    detectedObligations: DetectedObligation[] | null;
    crossValidations: DocumentValidation[] | null;
    reliabilityFlags: ReliabilityFlag[] | null;
    createdAt: string;
    updatedAt: string;
}

/** Step 2 del estudio de capacidad (reemplaza a los estados financieros). */
export interface CreditStudyDocumentsStep {
    documents: StudyDocument[];
    coverage: DocumentCoverage;
    analysis: PaymentCapacityAnalysis | null;
}

/** Respuesta de subir/eliminar un documento: la cobertura viene recalculada. */
export interface UploadDocumentResponse {
    document: StudyDocument;
    coverage: DocumentCoverage;
}

export interface DeleteDocumentResponse {
    success: boolean;
    coverage: DocumentCoverage;
}

export interface StudyDocumentListResponse {
    documents: StudyDocument[];
    coverage: DocumentCoverage;
}

export interface StudyDocumentFileUrl {
    url: string;
    expiresInSeconds: number;
    fileName: string;
}

/** Cifras de capacidad que acompañan al resultado del scoring (step 3). */
export interface CapacityFigures {
    verifiedMonthlyIncome: number;
    payrollNetIncome: number | null;
    bankStatementIncome: number;
    incomeVerificationIndex: number | null;
    incomeCv: number | null;
    monthsWithIncome: number;
    coveredMonths: number;
    windowMonths: number;
    /** Compromisos contractuales; no incluye el costo de vida. */
    recurringFixedExpenses: number;
    /** Cuotas + tarjeta: todo lo que sale por obligaciones. */
    existingDebtPayments: number;
    /** Servicio de deuda sin tarjeta: es el que mide el DTI. */
    debtServicePayments: number;
    cardPayments: number;
    /** Costo de vida observado; se informa, no resta del disponible. */
    livingCost: number;
    availableIncome: number;
    maxSuggestedInstallment: number;
    payrollLoanCapacity: number | null;
    currentDti: number | null;
    /** Cuotas mínimas en que el monto solicitado cabe en la cuota máxima, sin
     *  intereses. Contraste informativo: el plazo lo decide quien presta. */
    minInstallmentsForRequested: number | null;
    paysOwnSocialSecurity: boolean;
    verifiedHireDate: string | null;
    employmentType: EmploymentTypeCode;
}
