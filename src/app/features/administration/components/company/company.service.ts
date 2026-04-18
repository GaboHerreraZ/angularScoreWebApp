import { ApiService } from '@/app/core/services/api.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '@/app/types/company';
import { Invitation, InvitationsResponse, PendingInvitationResponse } from '@/app/types/invitation';
import { SubscriptionDetails } from '@/app/types/subscription';

@Injectable({ providedIn: 'root' })
export class CompanyService {

    constructor(private api: ApiService) {}

    createCompany(payload: Partial<Company>): Observable<Company> {
        return this.api.post<Company>('companies', payload);
    }

    getCompanyByUser(userId: string): Observable<Company[]> {
        return this.api.get<Company[]>(`companies/user/${userId}`);
    }

    updateCompany(id: string, payload: Partial<Company>): Observable<Company> {
        return this.api.patch<Company>(`companies/${id}`, payload);
    }

    uploadLogo(companyId: string, file: File): Observable<Company> {
        const formData = new FormData();
        formData.append('logo', file);
        return this.api.patch<Company>(`companies/${companyId}/logo`, formData);
    }

    getSubscriptionDetails(companyId: string): Observable<SubscriptionDetails> {
        return this.api.get<SubscriptionDetails>(`companies/${companyId}/subscription-details`);
    }

    cancelSubscription(companyId: string): Observable<void> {
        return this.api.post<void>(`companies/${companyId}/subscriptions/cancel`, {});
    }

    inviteUser(companyId: string, email: string): Observable<void> {
        return this.api.post<void>(`companies/${companyId}/invitations`, { email });
    }

    getInvitations(userId: string): Observable<InvitationsResponse> {
        return this.api.get<InvitationsResponse>(`users/${userId}/invitations`);
    }

    deleteInvitation(invitationId: string): Observable<void> {
        return this.api.delete<void>(`invitations/${invitationId}`);
    }

    getPendingInvitation(email: string): Observable<PendingInvitationResponse> {
        return this.api.get<PendingInvitationResponse>(`invitations/pending/${email}`);
    }

    getInvitationById(invitationId: string): Observable<Invitation> {
        return this.api.get<Invitation>(`invitations/${invitationId}`);
    }

    rejectInvitation(invitationId: string, token: string): Observable<void> {
        return this.api.post<void>(`invitations/${invitationId}/reject`, { token });
    }

    acceptInvitationRegister(invitationId: string, userId: string, token: string): Observable<Invitation> {
        return this.api.post<Invitation>(`invitations/${invitationId}/accept-register`, { userId, token });
    }

    toggleInvitationStatus(invitationId: string, isActive: boolean): Observable<void> {
        return this.api.patch<void>(`invitations/${invitationId}/toggle-status`, { isActive });
    }
}
