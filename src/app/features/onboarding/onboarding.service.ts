import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import {
    AnalysisPackByReference,
    OnboardingByProfile,
    OnboardingRequest,
    OnboardingResponse,
    PackOffering,
    PurchasePackRequest,
    PurchasePackResponse
} from '@/app/types/onboarding';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
    private api = inject(ApiService);

    /** Crea perfil + empresa + billing del usuario logueado y lo asocia como administrador. */
    submitOnboarding(payload: OnboardingRequest): Observable<OnboardingResponse> {
        return this.api.post<OnboardingResponse>('onboarding', payload, {
            params: { role: 'administrator' },
            headers: { 'X-Silent-Error': 'true' }
        });
    }

    /**
     * Onboarding ya registrado del usuario, por su profileId. Devuelve 404 si
     * el perfil no existe o no tiene empresa activa. Silenciamos el error para
     * tratar el 404 como "aún no hay onboarding" en la UI.
     */
    getOnboardingByProfile(profileId: string): Observable<OnboardingByProfile> {
        return this.api.get<OnboardingByProfile>(`onboarding/${profileId}`, {
            headers: { 'X-Silent-Error': 'true' }
        });
    }

    /** Catálogo de packs de consultas disponibles para compra. */
    getPackCatalog(): Observable<PackOffering[]> {
        return this.api.get<PackOffering[]>('pack-offerings/catalog');
    }

    /**
     * Compra un pack y devuelve el sessionId del checkout de ePayco.
     * Requiere usuario logueado que pertenezca al companyId; el backend lee
     * los billing* de la empresa para armar la sesión de pago.
     */
    purchasePack(companyId: string, payload: PurchasePackRequest): Observable<PurchasePackResponse> {
        return this.api.post<PurchasePackResponse>(
            `companies/${companyId}/analysis-packs/purchase`,
            payload,
            { headers: { 'X-Silent-Error': 'true' } }
        );
    }

    /**
     * Consulta el estado del pack por la referencia de ePayco. Se usa en la
     * pantalla de resultado para hacer polling hasta que el webhook lo active.
     * Silenciamos el 404 (esperado mientras el webhook aún no registra el ref).
     */
    getPackByReference(refPayco: string): Observable<AnalysisPackByReference> {
        return this.api.get<AnalysisPackByReference>(`analysis-packs/by-reference/${refPayco}`, {
            headers: { 'X-Silent-Error': 'true' }
        });
    }
}
