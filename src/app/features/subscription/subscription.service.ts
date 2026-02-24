import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { PlanItem, CreateTransactionRequest, CompanySubscription } from '@/app/types/subscription';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    constructor(private api: ApiService) {}

    getPublicPlans(): Observable<PlanItem[]> {
        return this.api.get<PlanItem[]>('subscriptions');
    }

    createTransaction(companyId: string, request: CreateTransactionRequest): Observable<CompanySubscription> {
        return this.api.post<CompanySubscription>(`companies/${companyId}/subscriptions/create-transaction`, request);
    }

    checkTransaction(companyId: string, paymentId: string): Observable<CompanySubscription> {
        return this.api.get<CompanySubscription>(`companies/${companyId}/subscriptions/check-transaction/${paymentId}`);
    }
}
