import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/** Departamento o municipio del catálogo DIVIPOLA. El `code` es el DANE:
 *  2 dígitos el departamento, 5 el municipio (los 2 primeros = departamento). */
export interface LocationOption {
    code: string;
    name: string;
}

/**
 * Catálogo geográfico oficial, servido por nuestra API. Antes se pedía a
 * api-colombia.com desde el navegador: dependencia externa dentro del
 * onboarding y sin código DANE, que es lo que exige la facturación electrónica.
 */
@Injectable({ providedIn: 'root' })
export class LocationsService {
    private api = inject(ApiService);

    getRegions(): Observable<LocationOption[]> {
        return this.api.get<LocationOption[]>('locations/regions');
    }

    getCities(regionCode: string): Observable<LocationOption[]> {
        return this.api.get<LocationOption[]>(`locations/regions/${regionCode}/cities`);
    }
}
