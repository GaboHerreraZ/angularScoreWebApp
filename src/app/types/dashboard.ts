export interface KpiValue {
    value: number;
    previous: number;
    delta: number;
    deltaPercent: number | null;
}

export interface AnalysisCredits {
    remaining: number;
    nearestExpiry: string | null;
}

export interface PipelineItem {
    statusId: number;
    code: string;
    label: string;
    count: number;
}

export interface StudyByMonth {
    month: string;
    count: number;
}

export interface RecentStudy {
    id: string;
    customerName: string;
    studyDate: string;
    statusCode: string;
    statusLabel: string;
    requestedCreditLine: number;
    approvedCreditLine: number;
    viabilityScore: number | null;
    viabilityStatus: string | null;
}

export interface BasicSummary {
    totalCustomers: KpiValue;
    studiesThisMonth: KpiValue;
    analysisCredits: AnalysisCredits;
}

export interface BasicCredit {
    totalRequestedThisMonth: KpiValue;
    totalApprovedThisMonth: KpiValue;
}

export interface BasicDashboard {
    summary: BasicSummary;
    credit: BasicCredit;
    pipeline: PipelineItem[];
    studiesByMonth: StudyByMonth[];
    recentStudies: RecentStudy[];
}

// Advanced-only fields
export interface DashboardPeriod {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
}

export interface AdvancedKpis {
    analysisCredits: AnalysisCredits;
    studiesInPeriod: KpiValue;
    approvalRate: KpiValue;
    avgViabilityScore: KpiValue;
}

export interface AdvancedCredit {
    totalRequested: KpiValue;
    totalApproved: KpiValue;
    approvedOverRequestedPercent: number;
}

export interface Verdicts {
    approved: number;
    conditional: number;
    rejected: number;
    analyzed: number;
}

export interface BureauRiskBand {
    code: string;
    label: string;
    min: number;
    count: number;
}

export interface BureauRisk {
    avgScore: number | null;
    consultedCustomers: number;
    withoutHistory: number;
    withArrears: number;
    byBand: BureauRiskBand[];
}

export interface TopCustomerByCredit {
    customerId: string;
    businessName: string;
    totalRequested: number;
    totalApproved: number;
    studiesCount: number;
}

export interface AdvancedDashboard {
    period: DashboardPeriod;
    kpis: AdvancedKpis;
    credit: AdvancedCredit;
    pipeline: PipelineItem[];
    verdicts: Verdicts;
    studiesByMonth: StudyByMonth[];
    bureauRisk: BureauRisk;
    topCustomersByCredit: TopCustomerByCredit[];
    recentStudies: RecentStudy[];
}

export type DashboardLevel = 'basic' | 'advanced' | 'premium';
