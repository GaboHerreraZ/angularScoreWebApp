import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { PublicPlansResponse } from '@/app/types/subscription';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
    constructor(private api: ApiService) {}

    getPublicPlans(): Observable<PublicPlansResponse> {
        return this.api.get<PublicPlansResponse>('subscriptions');
    }
}
