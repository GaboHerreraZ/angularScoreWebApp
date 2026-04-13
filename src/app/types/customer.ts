import { Parameter } from "./parameter";

export interface Country {
    name?: string;
    code?: string;
}

export interface Representative {
    name?: string;
    image?: string;
}

export interface Customer {
    id?: number;
    personTypeId: number;
    identificationTypeId: number;
    businessName: string;
    identificationNumber: string;
    legalRepName?: string;
    legalRepId?: string;
    legalRepIdentificationTypeId?: number;
    legalRepEmail?: string;
    legalRepPhone?: string;
    economicActivityId?: number;
    seniority: number;
    email?: string;
    phone?: string;
    secondaryPhone?: string;
    state?: string;
    city?: string;
    address?: string;
    commercialRef1Name?: string;
    commercialRef1Contact?: string;
    commercialRef1Phone?: string;

    commercialRef2Name?: string;
    commercialRef2Contact?: string;
    commercialRef2Phone?: string;
    observations?: string;
    personType?: Parameter;
    identificationType?: Parameter;
    economicActivity?: Parameter;

}
