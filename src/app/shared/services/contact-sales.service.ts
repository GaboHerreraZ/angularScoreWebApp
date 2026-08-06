import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { ContactSalesRequest, ContactSalesResponse } from '@/app/types/contact-sales';

/**
 * Envío de mensajes al área comercial desde el landing público.
 * No requiere autenticación: lo usa un visitante interesado en CREDIT-IA.
 */
@Injectable({ providedIn: 'root' })
export class ContactSalesService {
    private api = inject(ApiService);

    /**
     * Envía el formulario de contacto al área comercial. Responde 201 con
     * `{ received, id }`. Silencia el toast genérico del interceptor: el
     * componente maneja los mensajes (incluido el 429 por rate limit).
     */
    sendContact(payload: ContactSalesRequest): Observable<ContactSalesResponse> {
        return this.api.post<ContactSalesResponse>('contact-sales', payload, {
            headers: { 'X-Silent-Error': 'true' }
        });
    }
}
