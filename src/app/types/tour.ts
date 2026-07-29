export interface TourStep {
    element?: string;
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    optional?: boolean;
    desktopOnly?: boolean;
}

export type TourKind =
    | 'overview'
    | 'task'
    | 'welcome';

export interface TourDefinition {
    id: string;
    title: string;
    description: string;
    kind: TourKind;
    icon: string;
    version: number;
    routes: string[];
    exactRoute?: boolean;
    steps: TourStep[];
    minutes?: number;
}

export interface TourSeenRecord {
    version: number;
    seenAt: string;
    skipped: boolean;
}

export type TourSeenMap = Record<string, TourSeenRecord>;
