export interface CustomerStatsStatusCount {
    code: string;
    label: string;
    count: number;
}

export interface CustomerStatsStudies {
    total: number;
    firstStudyDate: string | null;
    lastStudyDate: string | null;
    daysSinceLastStudy: number | null;
    byStatus: CustomerStatsStatusCount[];
}

export type ScoreTrend = 'up' | 'down' | 'flat' | null;

export interface CustomerStatsViability {
    analyzed: number;
    approved: number;
    conditional: number;
    rejected: number;
    approvalRate: number | null;
    avgScore: number | null;
    lastScore: number | null;
    lastStatus: string | null;
    scoreTrend: ScoreTrend;
}

export interface CustomerStatsAmounts {
    totalRequested: number;
    avgRequested: number;
    totalRecommended: number;
    avgRecommended: number;
    recommendationRatio: number | null;
    lastRecommendedCreditLine: number | null;
}

export interface CustomerStatsTiming {
    avgResolutionDays: number | null;
    studiesLast12Months: number;
}

export interface CustomerStats {
    customerId: string;
    studies: CustomerStatsStudies;
    viability: CustomerStatsViability;
    amounts: CustomerStatsAmounts;
    timing: CustomerStatsTiming;
}
