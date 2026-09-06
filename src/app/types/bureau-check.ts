/**
 * Consulta de riesgo crediticio (bureauCheck): servicio de consulta + análisis
 * IA del perfil en centrales, con informe propio. El snapshot crudo de la
 * central NUNCA viaja: el API entrega el dato transformado (analysis).
 */

import { CustomerAuthorization } from './credit-study';

export type BureauRiskLevel = 'low' | 'medium' | 'high';

export interface BureauCheckFlag {
    severity: 'warning' | 'danger';
    title: string;
    detail: string;
}

export interface BureauCheckSignal {
    title: string;
    detail: string;
}

export interface BureauCheckSections {
    indebtedness: string;
    paymentHabits: string;
    alerts: string;
    income: string;
}

export interface BureauCheckRecommendation {
    title: string;
    detail: string;
}

/** Sector con actividad crediticia (formato propio, nunca la tabla de la central). */
export interface BureauCheckSectorActivity {
    sector: string | null;
    description: string | null;
    vigentes: number;
    cerrados: number;
    saldoActual: number | null;
    saldoMora: number | null;
    porcentajeDeuda: string | null;
    valorCuota: number | null;
}

export interface BureauCheckTimelinePoint {
    month: string | null;
    code: string | null;
    label: string | null;
    status: 'ok' | 'delay' | 'severe' | 'unknown';
}

export interface BureauCheckPaymentStats {
    monthsWithData: number;
    onTimePct: number | null;
    delayMonths: number;
    worstLabel: string | null;
    lastDelayMonth: string | null;
}

export interface BureauCheckBalanceTrend {
    direction: 'down' | 'stable' | 'up';
    label: string;
}

export interface BureauCheckAlertDetail {
    message: string | null;
    date: string | null;
}

/** Subset curado del snapshot, congelado al generar el análisis. */
export interface BureauCheckKeyFigures {
    consultedAt: string | null;
    score: number | null;
    viabilidad: string | null;
    ratingRecaudos: string | null;
    txtProbabilidad?: string | null;
    saldoActual: number | null;
    saldoMora: number | null;
    porcentajeDeuda: number | null;
    montoSugerido: number | null;
    reportedIncome: number | null;
    quotaToIncomePct: number | null;
    hasAlertas: boolean;
    sectorsWithCredits: number;
    // Enriquecimiento (análisis generados desde 2026-09): los viejos no lo traen.
    creditosVigentes?: number;
    creditosCerrados?: number;
    valorCuota?: number | null;
    totalCodeudorOtros?: number | null;
    sectorActivity?: BureauCheckSectorActivity[];
    paymentTimeline?: BureauCheckTimelinePoint[];
    paymentStats?: BureauCheckPaymentStats | null;
    balanceTrend?: BureauCheckBalanceTrend | null;
    alertsDetail?: BureauCheckAlertDetail[];
}

export interface BureauCheckAmountComparison {
    requested: number | null;
    suggested: number | null;
    ratio: number | null;
    verdict: 'within' | 'above' | 'far_above' | 'not_comparable';
    verdictLabel: string;
}

export interface BureauCheckAnalysis {
    summary: string;
    riskLevel: BureauRiskLevel;
    redFlags: BureauCheckFlag[];
    positiveSignals: BureauCheckSignal[];
    sections: BureauCheckSections;
    keyFigures: BureauCheckKeyFigures;
    amountComparison: BureauCheckAmountComparison;
    recommendations?: BureauCheckRecommendation[] | null;
    createdAt: string;
    updatedAt: string;
}

/** Verificación de identidad: nombre digitado vs registrado en la central. */
export interface BureauCheckIdentity {
    typedName: string | null;
    centralName: string | null;
    matches: boolean | null;
}

export interface BureauCheckCustomer {
    id: string;
    businessName: string | null;
    identificationNumber: string | null;
    verificationDigit: string | null;
    personType: { id: number; code: string; label: string } | null;
    firstName: string | null;
    secondName: string | null;
    firstLastName: string | null;
    secondLastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    birthDate: string | null;
    birthCity: string | null;
    gender: string | null;
    ageRange: string | null;
    documentStatus: string | null;
    identificationType?: { code: string | null; label: string | null } | null;
    nationality?: string | null;
    lastConsultedAt: string | null;
    city: string | null;
    state: string | null;
}

export interface BureauCheckDetail {
    creditStudyId: string;
    status: { id: number; code: string; label: string } | null;
    studyDate: string | null;
    requestedCreditLine: number | null;
    customer: BureauCheckCustomer | null;
    identity?: BureauCheckIdentity | null;
    analysis: BureauCheckAnalysis | null;
}

export interface CreateBureauCheckPayload {
    identificationTypeCode: string;
    numeroIdentificacion: string;
    apellidoRazonSocial: string;
    titularEmail: string;
    titularCity?: string;
    requestedCreditLine?: number;
}

export interface CreateBureauCheckResponse {
    status?: 'created' | 'authorization_pending';
    creditStudyId?: string;
    authorization?: CustomerAuthorization;
}
