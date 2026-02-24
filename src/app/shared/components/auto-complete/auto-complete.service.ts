import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface AutoCompleteOption {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutoCompleteService {
  private readonly apiService = inject(ApiService);

  private readonly endpoints: Record<string, string> = {
    customers: 'companies/{companyId}/customers/autocomplete',
    // Agregar más endpoints aquí según sea necesario
  };

  search(
    key: string,
    searchTerm: string,
    params?: Record<string, string | number>
  ): Observable<AutoCompleteOption[]> {
    let url = this.endpoints[key];

    if (!url) {
      throw new Error(`Endpoint key "${key}" not found in AutoCompleteService`);
    }

    // Reemplazar parámetros en la URL
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        url = url.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    // Agregar el término de búsqueda como query parameter
    return this.apiService.get<AutoCompleteOption[]>(url, {
      params: { search: searchTerm }
    });
  }
}
