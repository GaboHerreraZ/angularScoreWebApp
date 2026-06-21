/** Tipos del formulario de contacto con el área comercial (landing público). */

/**
 * Asunto del contacto. Determina cómo enruta el equipo comercial el mensaje.
 * El backend también acepta 'integration', pero el front no lo ofrece como opción.
 */
export type ContactSalesSubject =
    | 'demo'
    | 'pricing'
    | 'volume'
    | 'support'
    | 'other';

/**
 * Cuerpo de POST /api/contact-sales.
 * Endpoint público (no requiere autenticación): lo envía un visitante del landing.
 * Rate-limited: 5 envíos por IP cada 10 min (excederlo → 429).
 */
export interface ContactSalesRequest {
    /** Asunto seleccionado por el usuario. */
    subject: ContactSalesSubject;
    /** Nombre de la empresa del interesado (1–255 chars). */
    companyName: string;
    /** Nombre de la persona que contacta (1–255 chars). */
    fullName: string;
    /** Correo de contacto (email válido, máx. 255 chars). */
    email: string;
    /** Teléfono en formato internacional, p. ej. +573001234567 (5–50 chars). */
    phone: string;
    /** Mensaje libre con el detalle de la consulta (1–1000 chars). */
    message: string;
}

/** Respuesta 201 de POST /api/contact-sales: confirma recepción y devuelve el id del lead. */
export interface ContactSalesResponse {
    received: boolean;
    id: string;
}
