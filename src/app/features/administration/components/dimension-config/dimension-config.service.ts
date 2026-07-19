import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    CreateScoringConfigurationDto,
    PersonTypeCode,
    ScoringConfiguration,
    ScoringDimension
} from '@/app/types/scoring-configuration';

/**
 * Configuraciones de ponderación (scoring) de la empresa: el catálogo de dimensiones,
 * la config vigente, el historial de versiones y la creación de una versión nueva.
 * El companyId sale del perfil.
 */
@Injectable({ providedIn: 'root' })
export class DimensionConfigService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private get basePath(): string {
        return `companies/${this.companyId()}/scoring-configurations`;
    }

    /** Catálogo completo de dimensiones del sistema (global, no por empresa). */
    getDimensions(): Observable<ScoringDimension[]> {
        return this.apiService.get<ScoringDimension[]>('scoring-dimensions');
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
     * Crea una versión nueva con las dimensiones habilitadas y sus pesos para el tipo de
     * persona indicado; queda vigente y la anterior pasa al historial. El backend responde
     * 400 si faltan las obligatorias, alguna no aplica al tipo, un peso es < 5 o no suman 100.
     */
    create(personType: PersonTypeCode, dto: CreateScoringConfigurationDto): Observable<ScoringConfiguration> {
        return this.apiService.post<ScoringConfiguration>(this.basePath, dto, { params: { personType } });
    }

    /**
     * Restaura la configuración del tipo de persona a los valores por defecto del sistema:
     * crea una versión nueva con las dimensiones y pesos predeterminados, que queda vigente
     * y desplaza la anterior al historial. Responde igual que {@link create}.
     */
    reset(personType: PersonTypeCode): Observable<ScoringConfiguration> {
        return this.apiService.post<ScoringConfiguration>(`${this.basePath}/reset`, null, { params: { personType } });
    }
}
