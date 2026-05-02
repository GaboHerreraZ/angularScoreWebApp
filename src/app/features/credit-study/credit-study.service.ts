import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, tap, switchMap } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { AiAnalysisResponse, CreateCreditStudy, ExtractedFinancialData } from '@/app/types/credit-study';
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

    companyId = signal<string>('');

    private loadTrigger$ = new BehaviorSubject<LoadCreditStudiesParams>({ page: 1, rows: 10, search: '' });

    creditStudies = signal<CreateCreditStudy[]>([]);
    loading = signal<boolean>(false);
    totalRecords = signal<number>(0);

    creditStudies$ = this.loadTrigger$.pipe(
        tap(() => this.loading.set(true)),
        switchMap((params) => {
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

    constructor() {
        const currentUser = this.authService.currentProfile();
        this.companyId.set(currentUser ? currentUser!.companyId : '');
    }

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

    performCreditStudy(id: string): Observable<any> {
        return this.apiService.get<any>(`${this.basePath}/${id}/perform`, {});
    }

    extractFinancialData(file: File): Observable<ExtractedFinancialData> {
        const formData = new FormData();
        formData.append('file', file);
        return this.apiService.post<ExtractedFinancialData>(`companies/${this.companyId()}/ai-analyses/extract-pdf`, formData);
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
