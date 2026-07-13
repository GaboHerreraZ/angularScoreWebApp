import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, tap, switchMap } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    AiAnalysisResponse,
    CreateCreditStudy,
    CreateFromBureauPayload,
    CreateFromBureauResponse,
    CreditStudyStepsResponse,
    ExtractFinancialStatementsResponse,
    PerformStudyResponse
} from '@/app/types/credit-study';
import { environment } from '@/environments/environment';

interface LoadCreditStudiesParams {
    page: number;
    rows: number;
    search: string;
}

@Injectable({ providedIn: 'root' })
export class CreditStudyService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);
    private http = inject(HttpClient);

    // Derivado del perfil de forma reactiva: el servicio es singleton y el perfil
    // puede no estar cargado cuando se construye (p. ej. justo tras login/invitación),
    // lo que dejaba companyId vacío y generaba URLs como `companies//credit-studies`.
    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private loadTrigger$ = new BehaviorSubject<LoadCreditStudiesParams>({ page: 1, rows: 10, search: '' });

    creditStudies = signal<CreateCreditStudy[]>([]);
    loading = signal<boolean>(false);
    totalRecords = signal<number>(0);

    creditStudies$ = this.loadTrigger$.pipe(
        tap(() => this.loading.set(true)),
        switchMap((params) => {
            // Evita pegarle al API sin companyId (URL `companies//credit-studies` → 404).
            if (!this.companyId()) {
                return of({ data: [] as CreateCreditStudy[], total: 0 });
            }

            const queryParams: Record<string, string | number | boolean> = {
                page: params.page,
                limit: params.rows
            };
            if (params.search) {
                queryParams['search'] = params.search;
            }

            return this.apiService.get<{ data: CreateCreditStudy[]; total: number }>(this.basePath, { params: queryParams }).pipe(
                catchError(() => of({ data: [] as CreateCreditStudy[], total: 0 }))
            );
        }),
        tap((response) => {
            this.creditStudies.set(response.data);
            this.totalRecords.set(response.total);
            this.loading.set(false);
        })
    );

    private get basePath(): string {
        return `companies/${this.companyId()}/credit-studies`;
    }

    loadCreditStudies(page: number = 1, rows: number = 10, search: string = ''): void {
        this.loadTrigger$.next({ page, rows, search });
    }

    exportToExcel(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${environment.apiUrl}/companies/${this.companyId()}/credit-studies/export`, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    createCreditStudy(creditStudy: Omit<CreateCreditStudy, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt' | 'statusId'>): Observable<CreateCreditStudy> {
        return this.apiService.post<CreateCreditStudy>(this.basePath, creditStudy);
    }

    updateCreditStudy(id: string, creditStudy: Omit<Partial<CreateCreditStudy>, 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>): Observable<CreateCreditStudy> {
        return this.apiService.patch<CreateCreditStudy>(`${this.basePath}/${id}`, creditStudy);
    }

    getCreditStudyById(id: string): Observable<CreateCreditStudy> {
        return this.apiService.get<CreateCreditStudy>(`${this.basePath}/${id}`);
    }

    /**
     * Crea el estudio de crédito a partir de la consulta al bureau: el backend
     * consulta al cliente en centrales de riesgo (o lo toma de la base de datos),
     * crea el customer si no existe y devuelve el id del estudio creado.
     */
    createFromBureau(payload: CreateFromBureauPayload): Observable<CreateFromBureauResponse> {
        return this.apiService.post<CreateFromBureauResponse>(`${this.basePath}/from-bureau`, payload);
    }

    /** Devuelve los datos de cada step del estudio (step1 = perfil del cliente en centrales). */
    getCreditStudySteps(creditStudyId: string): Observable<CreditStudyStepsResponse> {
        return this.apiService.get<CreditStudyStepsResponse>(`${this.basePath}/${creditStudyId}/steps`);
    }

    /**
     * Sube el PDF de estados financieros del cliente para extraer los periodos.
     * El backend combina lo extraído del PDF con lo consultado en Datacrédito.
     */
    extractFinancialStatements(creditStudyId: string, file: File): Observable<ExtractFinancialStatementsResponse> {
        const formData = new FormData();
        formData.append('file', file);
        return this.apiService.post<ExtractFinancialStatementsResponse>(
            `${this.basePath}/${creditStudyId}/financial-statements/extract-pdf`,
            formData
        );
    }

    performCreditStudy(id: string): Observable<any> {
        return this.apiService.get<any>(`${this.basePath}/${id}/perform`, {});
    }

    /** Ejecuta el análisis de scoring del estudio y devuelve el resultado de viabilidad. */
    performStudy(id: string): Observable<PerformStudyResponse> {
        return this.apiService.post<PerformStudyResponse>(`${this.basePath}/${id}/perform`, {});
    }

    extractFinancialData(file: File, params: {
        customerId: string;
        studyDate: string;
        requestedTerm: number;
        requestedCreditLine: number;
        incomeStatementId?: number;
        notes?: string;
    }): Observable<CreateCreditStudy> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('customerId', params.customerId);
        formData.append('studyDate', params.studyDate);
        formData.append('requestedTerm', String(params.requestedTerm));
        formData.append('requestedCreditLine', String(params.requestedCreditLine));
        if (params.incomeStatementId != null) {
            formData.append('incomeStatementId', String(params.incomeStatementId));
        }
        if (params.notes) {
            formData.append('notes', params.notes);
        }
        return this.apiService.post<CreateCreditStudy>(`companies/${this.companyId()}/ai-analyses/extract-pdf`, formData);
    }

    previewPromissoryNote(creditStudyId: string): Observable<{ html: string }> {
        return this.apiService.post<{ html: string }>(`companies/${this.companyId()}/promissory-notes/preview`, { creditStudyId });
    }

    declinePromissoryNote(promissoryNoteId: number): Observable<any> {
        return this.apiService.patch<any>(`companies/${this.companyId()}/promissory-notes/${promissoryNoteId}/decline`, {});
    }

    approveCreditStudy(creditStudyId: string): Observable<any> {
        return this.apiService.post<any>(`companies/${this.companyId()}/promissory-notes/html`, { creditStudyId });
    }

    performAiAnalysis(creditStudyId: string): Observable<AiAnalysisResponse> {
        return this.apiService.post<AiAnalysisResponse>(`companies/${this.companyId()}/ai-analyses/credit-studies/${creditStudyId}`, {});
    }
}
