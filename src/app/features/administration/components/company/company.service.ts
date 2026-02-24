import { ApiService } from '@/app/core/services/api.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '@/app/types/company';
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
}
