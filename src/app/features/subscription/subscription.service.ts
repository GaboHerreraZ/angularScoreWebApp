import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { PublicPlansResponse, CreateTransactionRequest, CompanySubscription } from '@/app/types/subscription';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    constructor(private api: ApiService) {}

    getPublicPlans(): Observable<PublicPlansResponse> {
        return this.api.get<PublicPlansResponse>('subscriptions');
    }

    createTransaction(companyId: string, request: CreateTransactionRequest): Observable<CompanySubscription> {
        return this.api.post<CompanySubscription>(`companies/${companyId}/subscriptions/create-transaction`, request);
    }

    checkTransaction(paymentId: string): Observable<CompanySubscription> {
        return this.api.get<CompanySubscription>(`subscriptions/check-transaction/${paymentId}`);
    }
}
