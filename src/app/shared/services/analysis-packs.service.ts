import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { AnalysisPacksResponse } from '@/app/types/analysis-pack';
import { PurchasePackRequest, PurchasePackResponse } from '@/app/types/onboarding';

/**
 * Paquetes de análisis de crédito de la empresa: histórico con consumos y
 * compra de nuevos paquetes. Compartido entre administración y el onboarding.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisPacksService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private get basePath(): string {
        return `companies/${this.companyId()}/analysis-packs`;
    }

    getPacksWithConsumptions(page: number = 1, limit: number = 5): Observable<AnalysisPacksResponse> {
        return this.apiService.get<AnalysisPacksResponse>(`${this.basePath}/with-consumptions`, {
            params: { page, limit }
        });
    }

    /**
     * Compra un pack y devuelve el sessionId del checkout de ePayco.
     * Requiere usuario logueado que pertenezca al companyId; el backend lee
     * los billing* de la empresa para armar la sesión de pago.
     */
    purchasePack(payload: PurchasePackRequest): Observable<PurchasePackResponse> {
        return this.apiService.post<PurchasePackResponse>(
            `${this.basePath}/purchase`,
            payload,
            { headers: { 'X-Silent-Error': 'true' } }
        );
    }
}
