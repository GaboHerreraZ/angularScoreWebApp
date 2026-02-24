import { Subscription } from './subscription';
import { Parameter } from './parameter';

export interface Company {
    id: string;
    subscriptionId: string;
    name: string;
    nit: string;
    sectorId: number;
    state: string;
    city: string;
    address: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    subscription: Subscription;
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
