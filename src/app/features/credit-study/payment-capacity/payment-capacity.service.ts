import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    DeleteDocumentResponse,
    StudyDocumentFileUrl,
    StudyDocumentListResponse,
    StudyDocumentTypeCode,
    UploadDocumentResponse
} from '@/app/types/payment-capacity';

/**
 * Documentos del estudio de capacidad de pago. La creación del estudio y el
 * perform se hacen con CreditStudyService (son los mismos endpoints del flujo
 * con EEFF); aquí solo vive lo propio de este tipo: subir, listar, ver y
 * eliminar los soportes de ingreso.
 */
@Injectable({ providedIn: 'root' })
export class PaymentCapacityService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    private companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private basePath(creditStudyId: string): string {
        return `companies/${this.companyId()}/credit-studies/${creditStudyId}/documents`;
    }

    /**
     * Sube un PDF y lo procesa en línea (extracción + validaciones). La
     * respuesta trae el documento ya procesado y la cobertura recalculada.
     */
    uploadDocument(
        creditStudyId: string,
        file: File,
        documentTypeCode: StudyDocumentTypeCode
    ): Observable<UploadDocumentResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentTypeCode', documentTypeCode);
        return this.apiService.post<UploadDocumentResponse>(this.basePath(creditStudyId), formData);
    }

    listDocuments(creditStudyId: string): Observable<StudyDocumentListResponse> {
        return this.apiService.get<StudyDocumentListResponse>(this.basePath(creditStudyId));
    }

    /** URL temporal (1 hora) del PDF original, para abrirlo en otra pestaña. */
    getDocumentFileUrl(creditStudyId: string, documentId: string): Observable<StudyDocumentFileUrl> {
        return this.apiService.get<StudyDocumentFileUrl>(`${this.basePath(creditStudyId)}/${documentId}/file`);
    }

    deleteDocument(creditStudyId: string, documentId: string): Observable<DeleteDocumentResponse> {
        return this.apiService.delete<DeleteDocumentResponse>(`${this.basePath(creditStudyId)}/${documentId}`);
    }
}
