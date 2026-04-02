import { ApiService } from '@/app/core/services/api.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '@/app/types/company';
import { Invitation, InvitationsResponse, PendingInvitationResponse } from '@/app/types/invitation';
import { AvailablePlans, SubscriptionUsage } from '@/app/types/subscription';

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

    getSubscriptionUsage(companyId: string): Observable<SubscriptionUsage> {
        return this.api.get<SubscriptionUsage>(`companies/${companyId}/subscription-usage`);
    }

    getAvailablePlans(companyId: string): Observable<AvailablePlans> {
        return this.api.get<AvailablePlans>(`companies/${companyId}/available-plans`);
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
