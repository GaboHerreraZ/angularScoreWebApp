import { Injectable, signal } from '@angular/core';

/**
 * Estado del diálogo "faltan datos de tu empresa". Lo abre el interceptor de
 * errores cuando la API responde COMPANY_DATA_INCOMPLETE (onboarding diferido:
 * crear estudios exige NIT; el pagaré, dirección/ciudad/bancarios).
 */
@Injectable({ providedIn: 'root' })
export class CompanyDataIncompleteService {
    visible = signal(false);
    message = signal('');

    open(message: string): void {
        this.message.set(message);
        this.visible.set(true);
    }

    close(): void {
        this.visible.set(false);
    }
}
