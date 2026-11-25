import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CustomerAuthorization } from '@/app/types/customer-authorization';

/**
 * Autorización de tratamiento de datos del titular, que es el gate del bureau:
 * los tres productos (estudio con EEFF, estudio de capacidad de pago y consulta
 * de riesgo) la necesitan firmada para poder consultar.
 *
 * Hay dos formas de satisfacerla y las dos viven aquí: consultar si el titular ya
 * firmó en línea, o cargar el PDF que la empresa ya tenía firmado. El ENVÍO del
 * documento a firmar no tiene endpoint propio: lo dispara el backend dentro de
 * `from-bureau` / `bureau-checks` cuando el titular aún no ha firmado.
 */
@Injectable({ providedIn: 'root' })
export class CustomerAuthorizationsService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    // Derivado del perfil de forma reactiva: el servicio es singleton y el perfil
    // puede no estar cargado al construirse, lo que dejaría URLs como
    // `companies//customer-authorizations`.
    private companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');
    private basePath = computed<string>(() => `companies/${this.companyId()}/customer-authorizations`);

    /**
     * ¿Ya firmó? Solo lectura: no dispara la creación del estudio (relanzar
     * `from-bureau` tras la firma sí lo crea).
     */
    getStatus(identificationNumber: string): Observable<CustomerAuthorization> {
        return this.apiService.get<CustomerAuthorization>(`${this.basePath()}/${identificationNumber}`);
    }

    /**
     * Carga el PDF de una autorización que el titular firmó fuera de la plataforma.
     * El backend la deja como firmada, así que el siguiente intento de creación ya
     * pasa el gate. Sin `Content-Type`: lo pone el browser con su boundary.
     */
    uploadSignedDocument(identificationNumber: string, file: File): Observable<CustomerAuthorization> {
        const formData = new FormData();
        formData.append('file', file);
        return this.apiService.post<CustomerAuthorization>(
            `${this.basePath()}/${identificationNumber}/signed-document`,
            formData
        );
    }
}
