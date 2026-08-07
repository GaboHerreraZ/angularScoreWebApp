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

// ─── Tareas guiadas ──────────────────────────────────────────────────────────
// A diferencia de los tours pasivos, en una tarea guiada el usuario ejecuta la
// acción real de cada paso y la guía avanza sola cuando la detecta.

/**
 * Condición que completa un paso:
 * - `next`: paso informativo, avanza con el botón "Siguiente".
 * - `route`: avanza cuando la URL coincide con `pattern` (el usuario navegó).
 * - `appear`: avanza cuando `element` aparece en el DOM (un modal se abrió,
 *   un resultado cargó) — la señal de que el usuario ejecutó la acción.
 */
export type FlowAdvance =
    | { on: 'next' }
    | { on: 'route'; pattern: string }
    | { on: 'appear'; element: string };

export interface FlowStep {
    /** Ruta donde vive el paso: exacta, o regex si empieza con `^`. */
    route: string;
    element?: string;
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    advance: FlowAdvance;
}

export interface FlowDefinition {
    id: string;
    title: string;
    description: string;
    icon: string;
    version: number;
    /** Si la tarea se inicia desde otra pantalla, primero se navega aquí. */
    startRoute: string;
    minutes?: number;
    steps: FlowStep[];
}
