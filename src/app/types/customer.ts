export interface Country {
    name?: string;
    code?: string;
}

export interface Representative {
    name?: string;
    image?: string;
}

/** Parámetro normalizado que devuelve el detalle de cliente (id + code + label). */
export interface CustomerParameter {
    id: number;
    code: string;
    label: string;
}

/** Fila del listado de clientes (GET /customers). */
export interface Customer {
    id: string;
    businessName: string;
    identificationNumber: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    personType?: CustomerParameter;
    economicActivity?: CustomerParameter;
}

export interface CustomerNameParts {
    firstName: string | null;
    secondName: string | null;
    firstLastName: string | null;
    secondLastName: string | null;
}

export interface CustomerDemographics {
    birthDate: string | null;
    birthCity: string | null;
    gender: string | null;
    ageRange: string | null;
    documentStatus: string | null;
}

// ── Bureau profile (solo persona jurídica) ─────────────────────────────────

export interface BureauGeneralProfile {
    legalOrganization: string | null;
    legalOrganizationLabel: string | null;
    ciiuCode: string | null;
    economicActivity: string | null;
    employeeCount: string | null;
    employeeRange: string | null;
    seized: string | null;
    seizedLabel: string | null;
    inLiquidation: string | null;
    inLiquidationLabel: string | null;
    incorporationDate: string | null;
    authorizedCapital: string | null;
    subscribedCapital: string | null;
    paidCapital: string | null;
}

export interface BureauRegistration {
    number: string | null;
    chamberOfCommerce: string | null;
    incorporation: string | null;
    lastRenewal: string | null;
    status: string | null;
}

export interface BureauPerson {
    documentType: string | null;
    documentNumber: string | null;
    name: string | null;
    lastName: string | null;
    role: string | null;
    appointmentDate: string | null;
    status: string | null;
    participation: string | null;
}

export interface BureauPeopleGroup {
    main: BureauPerson[] | null;
    alternates: BureauPerson[] | null;
}

export interface BureauStatutoryAuditors extends BureauPeopleGroup {
    auditFirm: BureauPerson | null;
}

export interface BureauPartners {
    list: BureauPerson[] | null;
    totalContributions: string | null;
}

export interface BureauContact {
    address: string | null;
    phone: string | null;
    city: string | null;
    email: string | null;
}

export interface BureauProfile {
    generalProfile: BureauGeneralProfile | null;
    registration: BureauRegistration | null;
    legalRep: BureauPeopleGroup | null;
    board: BureauPeopleGroup | null;
    statutoryAuditors: BureauStatutoryAuditors | null;
    partners: BureauPartners | null;
    contact: BureauContact | null;
}

/** Representante legal registrado por la empresa (solo persona jurídica). */
export interface CustomerLegalRep {
    name: string | null;
    identificationType: CustomerParameter | null;
    identificationNumber: string | null;
    email: string | null;
    phone: string | null;
}

/** Detalle completo de un cliente (GET /customers/:id). */
export interface CustomerDetail {
    id: string;
    companyId: string;
    personType: CustomerParameter;
    identificationType: CustomerParameter;
    businessName: string;
    identificationNumber: string;
    verificationDigit: string | null;
    economicActivity: CustomerParameter;
    nameParts: CustomerNameParts | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    legalRep?: CustomerLegalRep | null;
    demographics: CustomerDemographics | null;
    bureauProfile: BureauProfile | null;
    bureauCreated: boolean;
    lastConsultedAt: string | null;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string | null;
}


export interface CustomerSigner {
    customerId: string;
    personType: CustomerParameter;

    // Persona jurídica
    legalRepName?: string | null;
    legalRepIdentificationTypeId?: number | null;
    legalRepIdentificationNumber?: string | null;
    legalRepEmail?: string | null;
    legalRepPhone?: string | null;

    // Persona natural
    identificationTypeId?: number | null;
    identificationNumber?: string | null;
    firstName?: string | null;
    secondName?: string | null;
    firstLastName?: string | null;
    secondLastName?: string | null;
    email?: string | null;
    phone?: string | null;
}

/** Campos editables del cliente (PATCH /companies/:companyId/customers/:id). */
export interface UpdateCustomerPayload {
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    economicActivityId: number | null;
    /** Representante legal: solo viaja para persona jurídica. */
    legalRepName?: string | null;
    legalRepIdentificationTypeId?: number | null;
    legalRepIdentificationNumber?: string | null;
    legalRepEmail?: string | null;
    legalRepPhone?: string | null;
}
