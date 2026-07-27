/** Tipos del Centro de Ayuda → Soporte. */

export type SupportTicketArea =
    | 'credit_study'
    | 'customer'
    | 'payment'
    | 'account'
    | 'other';

export type SupportTicketType = 'bug' | 'question' | 'request';

export type SupportTicketPriority = 'low' | 'medium' | 'high';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

/** Contexto técnico capturado en el cliente para acelerar el diagnóstico. */
export interface SupportTicketContext {
    appRoute?: string;
    userAgent?: string;
    viewport?: string;
    appVersion?: string;
}

/**
 * Cuerpo de POST companies/{companyId}/support-tickets. companyId y createdBy
 * los pone el backend (ruta y token). Los ids se envían solo cuando el ticket
 * nace desde la pantalla del registro: `credit_study` exige creditStudyId y
 * `customer` exige customerId; las demás áreas no llevan ids.
 */
export interface CreateSupportTicketRequest {
    area: SupportTicketArea;
    type: SupportTicketType;
    priority: SupportTicketPriority;
    /** 1–255 chars. */
    subject: string;
    /** 1–5000 chars. */
    description: string;
    creditStudyId?: string | null;
    customerId?: string | null;
    context?: SupportTicketContext;
}

export interface SupportTicket extends CreateSupportTicketRequest {
    id: string;
    /** Código legible, p. ej. "SUP-2026-000123". */
    reference: string;
    companyId: string;
    createdBy: string;
    status: SupportTicketStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupportTicketResponse {
    id: string;
    reference: string;
    status: SupportTicketStatus;
    createdAt: string;
}

/**
 * Contexto con el que se abre el Centro de Ayuda desde una pantalla concreta:
 * fija el área del ticket y el registro (estudio o cliente) al que apunta.
 */
export interface SupportTicketPrefill {
    area: Extract<SupportTicketArea, 'credit_study' | 'customer'>;
    creditStudyId?: string | null;
    customerId?: string | null;
    /** Nombre legible del registro, para mostrarlo en el formulario. */
    label?: string | null;
}
