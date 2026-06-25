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

/** Tipo del registro al que apunta `relatedEntityId` (FK polimórfica). */
export type SupportTicketRelatedEntityType = 'credit_study' | 'customer' | 'payment';

/** Contexto técnico capturado en el cliente para acelerar el diagnóstico. */
export interface SupportTicketContext {
    appRoute?: string;
    userAgent?: string;
    viewport?: string;
    appVersion?: string;
}

/** Cuerpo de POST companies/{companyId}/support-tickets. companyId y createdBy los pone el backend. */
export interface CreateSupportTicketRequest {
    area: SupportTicketArea;
    type: SupportTicketType;
    priority: SupportTicketPriority;
    /** 5–120 chars. */
    subject: string;
    /** 20–2000 chars. */
    description: string;
    /** `null` si no apunta a un registro; debe ser coherente con `area`. */
    relatedEntityType: SupportTicketRelatedEntityType | null;
    relatedEntityId: string | null;
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

/** Opción del selector de "registro relacionado". */
export interface RelatedEntityOption {
    id: string;
    label: string;
}
