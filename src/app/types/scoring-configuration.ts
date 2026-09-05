/**
 * Configuración de ponderación (scoring) de una empresa: qué dimensiones pesan y
 * cuánto al calcular el estudio de crédito. El catálogo de dimensiones lo define el
 * backend (GET /api/scoring-dimensions); la empresa habilita las que quiera y les
 * asigna un peso. Los pesos de las habilitadas deben sumar 100 y cada uno ser ≥ 5.
 *
 * Endpoints:
 * - GET  /api/scoring-dimensions                                  → catálogo completo de dimensiones
 * - GET  companies/:companyId/scoring-configurations/active       → config vigente (weights[] anidado)
 * - GET  companies/:companyId/scoring-configurations              → historial (reciente primero)
 * - POST companies/:companyId/scoring-configurations?personType=  → crea versión nueva; la anterior pasa a histórica
 */

import { StudyTypeCode } from './payment-capacity';

/** Peso mínimo permitido por dimensión habilitada. */
export const MIN_DIMENSION_WEIGHT = 5;

/** Suma exacta que deben alcanzar los pesos de las dimensiones habilitadas. */
export const TOTAL_WEIGHT = 100;

/** Codes de las dimensiones obligatorias: siempre habilitadas, no se pueden quitar. */
export const REQUIRED_DIMENSION_CODES = ['paymentCapacity', 'centralRisk'] as const;

/**
 * Tipo de persona al que aplica una configuración de scoring. Cada empresa tiene
 * una config independiente por tipo: Persona Jurídica (default) y Persona Natural.
 */
export type PersonTypeCode = 'legalEntity' | 'naturalPerson';

/** Metadatos de UI de cada tipo de persona (para los tabs). */
export interface PersonTypeTab {
    code: PersonTypeCode;
    label: string;
    icon: string;
}

export const PERSON_TYPE_TABS: PersonTypeTab[] = [
    { code: 'legalEntity', label: 'Persona Jurídica', icon: 'pi pi-building' },
    { code: 'naturalPerson', label: 'Persona Natural', icon: 'pi pi-user' }
];

/**
 * Cada tipo de estudio pondera dimensiones distintas (el empresarial evalúa
 * estados financieros; el de capacidad, el flujo de caja del titular), así que
 * cada uno tiene su propia configuración vigente.
 */
export interface StudyTypeTab {
    code: StudyTypeCode;
    label: string;
    icon: string;
}

export const STUDY_TYPE_TABS: StudyTypeTab[] = [
    { code: 'financialStatements', label: 'Estudio Empresarial', icon: 'pi pi-briefcase' },
    { code: 'paymentCapacity', label: 'Capacidad de Pago', icon: 'pi pi-wallet' }
];

/** Tipo de persona expandido que devuelve el backend en la configuración. */
export interface PersonType {
    id: number;
    code: PersonTypeCode;
    label: string;
    description?: string | null;
}

// ── Catálogo de dimensiones (GET /api/scoring-dimensions) ──────────────────

/** A qué tipos de persona aplica una dimensión. */
export interface DimensionAppliesTo {
    legalEntity: boolean;
    naturalPerson: boolean;
}

/** Una dimensión del catálogo del sistema. */
export interface ScoringDimension {
    id: number;
    code: string;
    label: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
    /** El motor la soporta (tiene lógica de evaluación). Si es false, no se puede habilitar. */
    supported: boolean;
    /** Obligatoria: no se puede deshabilitar. */
    required: boolean;
    /** Tipos de persona a los que aplica. */
    appliesTo: DimensionAppliesTo;
}

// ── Configuración activa (weights anidados) ────────────────────────────────

/** Dimensión reducida que viene dentro de cada peso del active/POST. */
export interface ConfigDimension {
    id: number;
    code: string;
    label: string;
    description: string | null;
    sortOrder: number;
}

/** Un peso de la configuración: la dimensión habilitada y su porcentaje. */
export interface ScoringWeightEntry {
    id: string;
    configId: string;
    dimensionId: number;
    weight: number;
    dimension: ConfigDimension;
}

export interface ScoringConfiguration {
    /** null cuando la empresa no tiene config propia y se están mostrando los defaults del sistema. */
    id: string | null;
    companyId: string | null;
    personTypeId?: number;
    /** Tipo de persona al que aplica esta configuración (expandido por el backend). */
    personType?: PersonType;
    studyTypeId?: number;
    /** Tipo de estudio al que aplica esta configuración (expandido por el backend). */
    studyType?: { id: number; code: StudyTypeCode; label: string };
    isActive: boolean;
    /** true cuando son los defaults del sistema (empresa sin config propia todavía). */
    isDefault?: boolean;
    createdBy?: string | null;
    /** Nombre de quien creó la versión, si el backend lo expande (para "quién cambió qué"). */
    createdByName?: string | null;
    createdAt?: string;
    /** Dimensiones habilitadas con su peso (las ausentes están deshabilitadas). */
    weights: ScoringWeightEntry[];
}

// ── Body del POST ──────────────────────────────────────────────────────────

/** Un peso a enviar: code de la dimensión + su porcentaje entero. */
export interface ScoringWeightInput {
    dimension: string;
    weight: number;
}

/** Cuerpo del POST: solo las dimensiones habilitadas. */
export interface CreateScoringConfigurationDto {
    weights: ScoringWeightInput[];
}

// ── Íconos locales por dimensión (el backend no manda íconos) ──────────────

const DIMENSION_ICONS: Record<string, string> = {
    financialHealth: 'pi pi-heart',
    paymentCapacity: 'pi pi-wallet',
    termCoherence: 'pi pi-clock',
    creditLineAdequacy: 'pi pi-sliders-h',
    capitalExposure: 'pi pi-shield',
    veracity: 'pi pi-verified',
    centralRisk: 'pi pi-chart-line',
    // Estudio de capacidad de pago
    incomeStability: 'pi pi-chart-bar',
    indebtedness: 'pi pi-percentage',
    financialBehavior: 'pi pi-building-columns',
    docVeracity: 'pi pi-file-check'
};

/** Ícono de una dimensión por su code, con fallback genérico para codes nuevos. */
export function dimensionIcon(code: string): string {
    return DIMENSION_ICONS[code] ?? 'pi pi-gauge';
}

/** ¿La dimensión aplica al tipo de persona indicado? */
export function dimensionAppliesTo(dim: ScoringDimension, personType: PersonTypeCode): boolean {
    return dim.appliesTo?.[personType] ?? false;
}
