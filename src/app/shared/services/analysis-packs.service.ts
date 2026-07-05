import { computed, inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { AnalysisPack, AnalysisPacksResponse } from '@/app/types/analysis-pack';
import { PromoCodeValidation, PurchasePackRequest, PurchasePackResponse } from '@/app/types/onboarding';

/** Código de estado del pack que aún espera confirmación de pago. */
const PENDING_PAYMENT_STATUS = 'pending_payment';

/**
 * Paquetes de análisis de crédito de la empresa: histórico con consumos y
 * compra de nuevos paquetes. Compartido entre administración y el onboarding.
 */
@Injectable({ providedIn: 'root' })
export class AnalysisPacksService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    /**
     * Ruta base de packs para una empresa. Usa el companyId del perfil por
     * defecto, pero acepta uno explícito para el onboarding: ahí la empresa se
     * acaba de crear y el perfil en memoria aún no tiene el companyId.
     */
    private basePathFor(companyId: string): string {
        return `companies/${companyId}/analysis-packs`;
    }

    private get basePath(): string {
        return this.basePathFor(this.companyId());
    }

    getPacksWithConsumptions(page: number = 1, limit: number = 5): Observable<AnalysisPacksResponse> {
        return this.apiService.get<AnalysisPacksResponse>(`${this.basePath}/with-consumptions`, {
            params: { page, limit }
        });
    }

    /**
     * Devuelve el pack que quedó esperando confirmación de pago (o null si no hay).
     * Se usa en la pantalla de pago pendiente para mostrar el resumen y permitir
     * reintentar el checkout con el mismo packOfferingId.
     */
    getPendingPack(): Observable<AnalysisPack | null> {
        return this.getPacksWithConsumptions(1, 10).pipe(
            map(res => res.data.find(pack => pack.status?.code === PENDING_PAYMENT_STATUS) ?? null)
        );
    }

    /**
     * Compra un pack y devuelve el sessionId del checkout de ePayco.
     * Requiere usuario logueado que pertenezca al companyId; el backend lee
     * los billing* de la empresa para armar la sesión de pago.
     */
    purchasePack(payload: PurchasePackRequest, companyId?: string): Observable<PurchasePackResponse> {
        const basePath = companyId ? this.basePathFor(companyId) : this.basePath;
        return this.apiService.post<PurchasePackResponse>(
            `${basePath}/purchase`,
            payload,
            { headers: { 'X-Silent-Error': 'true' } }
        );
    }

    /**
     * Valida un código promocional para previsualizar el descuento antes de pagar.
     * No canjea el código (eso ocurre al confirmarse el pago). Responde siempre 200:
     * el resultado de negocio viene en `valid`/`reason`.
     */
    validatePromoCode(code: string): Observable<PromoCodeValidation> {
        return this.apiService.get<PromoCodeValidation>(
            `companies/${this.companyId()}/promo-codes/validate`,
            { params: { code }, headers: { 'X-Silent-Error': 'true' } }
        );
    }
}
