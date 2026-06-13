export type InvitationType = 'account_onboarding' | 'collaboration';

export interface Invitation {
    id: string;
    companyId: string;
    invitedBy: string | null;
    email: string;
    roleId: number;
    type: InvitationType;
    statusId: number;
    token?: string;
    expiresAt?: string;
    respondedAt: string | null;
    createdAt: string;
    updatedAt: string;
    company: {
        id: string;
        name: string;
        nit: string;
        sectorId: number;
        state: string;
        city: string;
        address: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
    invitedByUser: {
        id: string;
        name: string;
        lastName: string;
        email: string;
    } | null;
    status: {
        id: number;
        type: string;
        code: string;
        label: string;
    };
}

export interface PendingInvitationResponse {
    hasPendingInvitation: boolean;
    invitation: Invitation | null;
}

export interface InvitationsResponse {
    data: Invitation[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
