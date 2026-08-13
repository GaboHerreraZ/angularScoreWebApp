// ─── Pagaré (documents/promissory-notes) ─────────────────────────────────────

import { CustomerSigner } from './customer';

export type PromissoryNoteSigner = Omit<CustomerSigner, 'customerId' | 'personType'>;

/** Cuerpo compartido del preview y de la creación del pagaré. */
export interface PromissoryNotePayload {
    creditStudyId: string;
    amount: number;
    termDays: number;
    signer?: PromissoryNoteSigner;
}

export interface PromissoryNotePreviewResponse {
    noteNumber: number;
    requestedCreditLine: number;
    /** Documento HTML completo del pagaré, ya rellenado. */
    html: string;
}

export interface PromissoryNoteStatus {
    id: number;
    type: string;
    code: string;
    label: string;
    description: string | null;
    isActive: boolean;
    sortOrder: number | null;
    parentId: number | null;
    createdAt: string;
    updatedAt: string;
}

/** Resumen del pagaré embebido en el GET /steps del estudio. */
export interface PromissoryNoteSummary {
    id: number;
    noteNumber: number;
    status: string;
    statusLabel: string;
    isSigned: boolean;
    amount: number;
    amountInWords: string;
    termDays: number;
    dueDate: string;
    signCity: string | null;
    signingUrl: string | null;
    hasSignedDocument: boolean;
    /** URL firmada (temporal) del PDF ya firmado en el storage. */
    documentUrl: string | null;
    sentAt: string | null;
    signedAt: string | null;
    declinedAt: string | null;
    refusedReason: string | null;
}

export interface PromissoryNote {
    id: number;
    companyId: string;
    creditStudyId: string;
    customerId: string;
    createdBy: string;
    statusId: number;

    noteNumber: number;

    amount: number;
    amountInWords: string;
    termDays: number;
    dueDate: string;

    signCity: string | null;
    creditorAddress: string | null;
    creditorAccountType: string | null;
    creditorAccountNumber: string | null;
    creditorBank: string | null;

    provider: string;
    providerDocToken: string | null;
    signerToken: string | null;
    templateId: string | null;

    signingUrl: string | null;
    signedDocumentUrl: string | null;
    signedFileStoragePath: string | null;

    sentAt: string | null;
    signedAt: string | null;
    declinedAt: string | null;
    refusedReason: string | null;

    createdAt: string;
    updatedAt: string;

    status?: PromissoryNoteStatus;
    customer?: {
        id: string;
        businessName: string;
        email: string;
        identificationNumber: string;
    };
    creditStudy?: {
        id: string;
        studyDate: string;
    };
}

// ─── Listado y detalle de pagarés (pantalla Pagarés) ─────────────────────────

export interface PromissoryNoteListMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/** Respuesta del GET /companies/{companyId}/documents/promissory-notes. */
export interface PromissoryNoteListResponse {
    data: PromissoryNote[];
    meta: PromissoryNoteListMeta;
}

/** Catálogo simple {id, code, label} de las relaciones del detalle. */
export interface PromissoryNoteCatalogItem {
    id: number;
    code: string;
    label: string;
}

/** Cliente (deudor) enriquecido que devuelve el detalle del pagaré. */
export interface PromissoryNoteDetailCustomer {
    id: string;
    businessName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    identificationNumber: string;
    verificationDigit: string | null;
    identificationType: PromissoryNoteCatalogItem | null;
    personType: PromissoryNoteCatalogItem | null;
    legalRepName: string | null;
    legalRepEmail: string | null;
}

/** Empresa acreedora que devuelve el detalle del pagaré. */
export interface PromissoryNoteDetailCompany {
    id: string;
    name: string;
    nit: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    logoUrl: string | null;
}

/** Resumen del estudio de crédito asociado al pagaré. */
export interface PromissoryNoteDetailCreditStudy {
    id: string;
    studyDate: string | null;
    resolutionDate: string | null;
    requestedTerm: number | null;
    requestedCreditLine: number | null;
    recommendedTerm: number | null;
    recommendedCreditLine: number | null;
    viabilityScore: number | null;
    viabilityStatus: string | null;
    status?: PromissoryNoteCatalogItem | null;
}

/** Respuesta del GET de detalle: el pagaré más sus relaciones enriquecidas. */
export interface PromissoryNoteDetail extends Omit<PromissoryNote, 'customer' | 'creditStudy'> {
    customer?: PromissoryNoteDetailCustomer | null;
    company?: PromissoryNoteDetailCompany | null;
    creditStudy?: PromissoryNoteDetailCreditStudy | null;
    createdByUser?: {
        id: string;
        name: string | null;
        lastName: string | null;
        email: string | null;
    } | null;
}

/** Respuesta del POST /payment-reminder. */
export interface PaymentReminderResponse {
    message: string;
    sentTo: string;
    adminsNotified: number;
    dueDate: string;
}
