import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PersonTypeCode, ScoringConfiguration, ScoringWeights } from '@/app/types/scoring-configuration';

/**
 * Configuraciones de ponderación (scoring) de la empresa: la vigente, el historial
 * de versiones y la creación de una versión nueva. El companyId sale del perfil.
 */
@Injectable({ providedIn: 'root' })
export class DimensionConfigService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private get basePath(): string {
        return `companies/${this.companyId()}/scoring-configurations`;
    }

    /**
     * Config activa del tipo de persona indicado. Si la empresa no tiene ninguna, el
     * backend devuelve los defaults del sistema con isDefault=true e id=null: el front
     * los muestra y al guardar crea la primera versión.
     */
    getActive(personType: PersonTypeCode): Observable<ScoringConfiguration> {
        return this.apiService.get<ScoringConfiguration>(`${this.basePath}/active`, { params: { personType } });
    }

    /** Todas las configuraciones del tipo de persona (reciente primero) para el historial. */
    getHistory(personType: PersonTypeCode): Observable<ScoringConfiguration[]> {
        return this.apiService.get<ScoringConfiguration[]>(this.basePath, { params: { personType } });
    }

    /**
     * Crea una versión nueva con los pesos dados para el tipo de persona indicado;
     * queda vigente y la anterior pasa al historial. El backend responde 400 si no
     * suman 100 o alguno es menor a 5.
     */
    create(personType: PersonTypeCode, weights: ScoringWeights): Observable<ScoringConfiguration> {
        return this.apiService.post<ScoringConfiguration>(this.basePath, weights, { params: { personType } });
    }
}
