import { inject, Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of, map, catchError, tap, switchMap } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CreateCreditStudy } from '@/app/types/credit-study';

interface LoadCreditStudiesParams {
    page: number;
    rows: number;
    search: string;
}

@Injectable({ providedIn: 'root' })
export class CreditStudyService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

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
                catchError((error) => {
                    console.error('Error al cargar estudios de crédito:', error);
                    return of({ data: [] as CreateCreditStudy[], total: 0 });
                })
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
        const { userCompanies } = currentUser ?? {};
        this.companyId.set(userCompanies ? userCompanies[0].companyId : '');
    }

    private get basePath(): string {
        return `companies/${this.companyId()}/credit-studies`;
    }

    loadCreditStudies(page: number = 1, rows: number = 10, search: string = ''): void {
        this.loadTrigger$.next({ page, rows, search });
    }

    createCreditStudy(creditStudy: Omit<CreateCreditStudy,'id'| 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>): Observable<{ success: boolean; error?: string; data?: CreateCreditStudy }> {
        return this.apiService.post<CreateCreditStudy>(this.basePath, creditStudy).pipe(
            map((response) => ({ success: true, data: response })),
            catchError((error) => {
                console.error('Error al crear estudio de crédito:', error);
                return of({ success: false, error: 'Error al crear el estudio de crédito' });
            })
        );
    }

    updateCreditStudy(id: string, creditStudy: Omit<Partial<CreateCreditStudy>, 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>): Observable<{ success: boolean; error?: string }> {
        return this.apiService.patch<CreateCreditStudy>(`${this.basePath}/${id}`, creditStudy).pipe(
            map(() => ({ success: true })),
            catchError((error) => {
                console.error('Error al actualizar estudio de crédito:', error);
                return of({ success: false, error: 'Error al actualizar el estudio de crédito' });
            })
        );
    }

    getCreditStudyById(id: string): Observable<CreateCreditStudy | null> {
        return this.apiService.get<CreateCreditStudy>(`${this.basePath}/${id}`).pipe(
            catchError((error) => {
                console.error('Error al obtener estudio de crédito:', error);
                return of(null);
            })
        );
    }

    performCreditStudy(id: string): Observable<{ success: boolean; error?: string; data?: any }> {
        // TODO: Reemplazar con la ruta correcta del endpoint cuando esté disponible
        const endpoint = `${this.basePath}/${id}/perform`;

        return this.apiService.get<any>(endpoint, {}).pipe(
            map((response) => ({ success: true, data: response })),
            catchError((error) => {
                console.error('Error al realizar estudio de crédito:', error);
                return of({ success: false, error: 'Error al realizar el estudio de crédito' });
            })
        );
    }
}
