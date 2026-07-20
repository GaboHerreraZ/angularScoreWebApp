// ─── Pagaré (documents/promissory-notes) ─────────────────────────────────────

/** Cuerpo compartido del preview y de la creación del pagaré. */
export interface PromissoryNotePayload {
    creditStudyId: string;
    amount: number;
    termDays: number;
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
