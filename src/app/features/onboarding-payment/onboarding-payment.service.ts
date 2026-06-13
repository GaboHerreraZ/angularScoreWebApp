import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import {
    OnboardingPaymentSummary,
    PayOnboardingRequest,
    PayOnboardingResponse
} from '@/app/types/onboarding-payment';

/**
 * Endpoints públicos (@Public) del checkout de suscripción que se abre desde un
 * enlace enviado por correo. Usan X-Silent-Error para manejar 404/409/400 con UI
 * propia en lugar del toast global.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingPaymentService {
    private api = inject(ApiService);

    getSummary(companySubscriptionId: string, token: string): Observable<OnboardingPaymentSummary> {
        return this.api.get<OnboardingPaymentSummary>('onboarding-payment/summary', {
            params: { companySubscriptionId, token },
            headers: { 'X-Silent-Error': 'true' }
        });
    }

    pay(payload: PayOnboardingRequest): Observable<PayOnboardingResponse> {
        return this.api.post<PayOnboardingResponse>('onboarding-payment/pay', payload, {
            headers: { 'X-Silent-Error': 'true' }
        });
    }
}
