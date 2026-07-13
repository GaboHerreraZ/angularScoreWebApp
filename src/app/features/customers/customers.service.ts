import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap, catchError, of } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Customer, CustomerDetail } from '@/app/types/customer';
import { CustomerStats } from '@/app/types/customer-stats';
import { CustomerCreditStudyResponse } from '@/app/types/credit-study';
import { AuthService } from '@/app/core/services/auth.service';
import { environment } from '@/environments/environment';

interface LoadCustomersParams {
    page: number;
    rows: number;
    search: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
    companyId = computed<string>(() => this.authSerive.currentProfile()?.companyId ?? '');

    private loadTrigger$ = new BehaviorSubject<LoadCustomersParams>({ page: 1, rows: 10, search: '' });

    customers = signal<Customer[]>([]);
    loading = signal<boolean>(false);
    totalRecords = signal<number>(0);

    authSerive = inject(AuthService);

    customers$ = this.loadTrigger$.pipe(
        tap(() => this.loading.set(true)),
        switchMap((params) => {
            // Evita pegarle al API sin companyId (URL `companies//customers` → 404).
            if (!this.companyId()) {
                return of({ data: [] as Customer[], total: 0 });
            }

            const queryParams: Record<string, string | number | boolean> = {
                page: params.page,
                limit: params.rows
            };
            if (params.search) {
                queryParams['search'] = params.search;
            }

            return this.apiService.get<{ data: Customer[]; total: number }>(this.basePath, { params: queryParams }).pipe(
                catchError(() => of({ data: [] as Customer[], total: 0 }))
            );
        }),
        tap((response) => {
            this.customers.set(response.data);
            this.totalRecords.set(response.total);
            this.loading.set(false);
        })
    );

    private http = inject(HttpClient);

    constructor(private apiService: ApiService) {}

    private get basePath(): string {
        return `companies/${this.companyId()}/customers`;
    }

    loadCustomers(page: number = 1, rows: number = 10, search: string = ''): void {
        this.loadTrigger$.next({ page, rows, search });
    }

    getCustomerById(id: string): Observable<CustomerDetail> {
        return this.apiService.get<CustomerDetail>(`${this.basePath}/${id}`);
    }

    exportToExcel(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${environment.apiUrl}/companies/${this.companyId()}/customers/export`, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    getCustomerCreditStudies(customerId: string): Observable<CustomerCreditStudyResponse[]> {
        return this.apiService.get<CustomerCreditStudyResponse[]>(`${this.basePath}/${customerId}/credit-studies`);
    }

    getCustomerStats(customerId: string): Observable<CustomerStats> {
        return this.apiService.get<CustomerStats>(`${this.basePath}/${customerId}/stats`);
    }
}
