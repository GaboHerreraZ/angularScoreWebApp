import { Parameter } from './parameter';

export interface Company {
    id: string;
    name: string;
    nit: string;
    sectorId: number;
    /** Código DANE del municipio (domicilio). */
    cityCode: string;
    /** Municipio y departamento ya resueltos por el API (solo lectura). */
    daneCity: { name: string; region: { name: string } };
    address: string;
    accountTypeId: number | null;
    accountBankId: number | null;
    accountNumber: string | null;
    logoUrl: string | null;
    logoSignedUrl: string | null;
    billingName: string | null;
    billingLastName: string | null;
    /** Razón social de facturación. Se usa en vez de nombre/apellido cuando el documento es NIT. */
    billingBusinessName: string | null;
    billingDocTypeId: number | null;
    billingDocNumber: string | null;
    billingEmail: string | null;
    billingAddress: string | null;
    billingCityCode: string | null;
    billingDaneCity: { name: string; region: { name: string } } | null;
    billingRegimeTypeId: number | null;
    /** Codes de Parameter 'fiscal_responsibility' (son los codigos DIAN). */
    billingFiscalResponsibilities: string[];
    billingPhone: string | null;
    legalRepName: string | null;
    legalRepIdentificationTypeId: number | null;
    legalRepIdentificationNumber: string | null;
    legalRepEmail: string | null;
    legalRepPhone: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    sector: Parameter;
    userCompanies: UserCompany[];
}


export interface UserCompany {
    id: string;
    userId: string;
    companyId: string;
    roleId: number;
    isActive: boolean;
    invitedBy: string | null;
    joinedAt: string | null;
    createdAt: string;
    updatedAt: string;
    role: Parameter;
    user: UserCompanyUser;
}

export interface UserCompanyUser {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
}
