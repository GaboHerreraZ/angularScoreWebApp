/**
 * Configuración de ponderación (scoring) de una empresa: cuánto pesa cada una de
 * las 7 dimensiones al calcular el estudio de crédito. Los pesos deben sumar 100
 * y cada uno ser ≥ 5 (validación replicada en el front, la valida también el backend).
 *
 * Endpoints:
 * - GET  companies/:companyId/scoring-configurations/active  → config vigente (o defaults con isDefault=true, id=null)
 * - GET  companies/:companyId/scoring-configurations         → historial (reciente primero)
 * - POST companies/:companyId/scoring-configurations         → crea una versión nueva; la anterior pasa al historial
 */

/** Peso mínimo permitido por dimensión. */
export const MIN_DIMENSION_WEIGHT = 5;

/** Suma exacta que deben alcanzar los 7 pesos. */
export const TOTAL_WEIGHT = 100;

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

/** Tipo de persona expandido que devuelve el backend en la configuración. */
export interface PersonType {
    id: number;
    code: PersonTypeCode;
    label: string;
    description?: string;
}

/** Claves de los 7 pesos que componen una configuración. */
export type ScoringWeightKey =
    | 'weightFinancialHealth'
    | 'weightPaymentCapacity'
    | 'weightTermCoherence'
    | 'weightCreditLineAdequacy'
    | 'weightCapitalExposure'
    | 'weightVeracity'
    | 'weightCentralRisk';

/** Solo los pesos (cuerpo del POST para crear una versión). */
export type ScoringWeights = Record<ScoringWeightKey, number>;

export interface ScoringConfiguration extends ScoringWeights {
    /** null cuando la empresa no tiene config propia y se están mostrando los defaults del sistema. */
    id: string | null;
    companyId: string | null;
    personTypeId?: number;
    /** Tipo de persona al que aplica esta configuración (expandido por el backend). */
    personType?: PersonType;
    isActive: boolean;
    /** true cuando son los defaults del sistema (empresa sin config propia todavía). */
    isDefault?: boolean;
    createdBy?: string | null;
    /** Nombre de quien creó la versión, si el backend lo expande (para "quién cambió qué"). */
    createdByName?: string | null;
    createdAt?: string;
}

/** Metadatos de UI de cada dimensión: label y tooltip explicativo. */
export interface DimensionMeta {
    key: ScoringWeightKey;
    label: string;
    tooltip: string;
    icon: string;
    /** Nota extra visible bajo el control (p. ej. Veracidad, que solo aplica con PDF). */
    note?: string;
    /**
     * Tipos de persona a los que aplica la dimensión. Si se omite, aplica a todos.
     * Veracidad solo aplica a Persona Jurídica: en Persona Natural no hay PDF de
     * estados financieros que contrastar, por lo que ni se muestra ni se edita
     * (se envía en 0 y las demás dimensiones deben sumar 100).
     */
    personTypes?: PersonTypeCode[];
}

/** Las dimensiones aplicables a un tipo de persona (respeta el orden original). */
export function dimensionsFor(personType: PersonTypeCode): DimensionMeta[] {
    return SCORING_DIMENSIONS.filter(d => !d.personTypes || d.personTypes.includes(personType));
}

/** Las 7 dimensiones con sus explicaciones para labels y tooltips del formulario. */
export const SCORING_DIMENSIONS: DimensionMeta[] = [
    {
        key: 'weightFinancialHealth',
        label: 'Salud financiera',
        icon: 'pi pi-heart',
        tooltip: 'Qué tan sólida es la empresa según su balance (liquidez, rentabilidad, endeudamiento). Un negocio robusto tiene baja probabilidad de quiebra.'
    },
    {
        key: 'weightPaymentCapacity',
        label: 'Capacidad de pago',
        icon: 'pi pi-wallet',
        tooltip: 'Si el flujo de caja del cliente alcanza para cubrir la cuota del crédito solicitado. Es la pregunta central: ¿puede pagar?'
    },
    {
        key: 'weightTermCoherence',
        label: 'Coherencia de plazos',
        icon: 'pi pi-clock',
        tooltip: 'Si el plazo del crédito calza con lo que el cliente tarda en cobrarle a sus propios clientes. Si el crédito vence antes de que él cobre, no tendrá con qué pagar.'
    },
    {
        key: 'weightCreditLineAdequacy',
        label: 'Adecuación del cupo',
        icon: 'pi pi-sliders-h',
        tooltip: 'Si el monto solicitado es razonable frente a su capacidad de pago. Un cupo demasiado alto para lo que puede pagar es riesgoso.'
    },
    {
        key: 'weightCapitalExposure',
        label: 'Exposición del capital',
        icon: 'pi pi-shield',
        tooltip: 'Cuánto capital propio queda inmovilizado y por cuánto tiempo. Como el crédito es sin intereses, prestar mucho por mucho tiempo es mal negocio aunque el cliente pueda pagar.'
    },
    {
        key: 'weightVeracity',
        label: 'Veracidad',
        icon: 'pi pi-verified',
        tooltip: 'Si los estados financieros del PDF coinciden con lo que la empresa reportó oficialmente en la central. Detecta cifras maquilladas.',
        note: 'Aplica solo si se carga el PDF de estados financieros. Si no hay con qué contrastar, su peso se reparte entre las demás.',
        // Solo Persona Jurídica: la Persona Natural no aporta PDF de estados financieros.
        personTypes: ['legalEntity']
    },
    {
        key: 'weightCentralRisk',
        label: 'Riesgo de la central',
        icon: 'pi pi-chart-line',
        tooltip: 'El nivel de riesgo que le asigna DataCrédito según su historial crediticio, sector y comportamiento de pago (mora). Es la opinión de un tercero experto.'
    }
];
