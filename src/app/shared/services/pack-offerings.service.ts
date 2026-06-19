import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { PackOffering } from '@/app/types/onboarding';

/**
 * Catálogo de packs de análisis de crédito disponibles para compra.
 * Compartido entre el landing, el wizard de onboarding y la sección de
 * compra en administración.
 */
@Injectable({ providedIn: 'root' })
export class PackOfferingsService {
    private api = inject(ApiService);

    getPackCatalog(): Observable<PackOffering[]> {
        return this.api.get<PackOffering[]>('pack-offerings/catalog');
    }
}
