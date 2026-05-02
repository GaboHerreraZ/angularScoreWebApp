import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap, catchError, of } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Customer } from '@/app/types/customer';
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
    companyId = signal<string>('');

    private loadTrigger$ = new BehaviorSubject<LoadCustomersParams>({ page: 1, rows: 10, search: '' });

    customers = signal<Customer[]>([]);
    loading = signal<boolean>(false);
    totalRecords = signal<number>(0);

    authSerive = inject(AuthService);

    customers$ = this.loadTrigger$.pipe(
        tap(() => this.loading.set(true)),
        switchMap((params) => {
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

    constructor(private apiService: ApiService) {
        const currentUser = this.authSerive.currentProfile();
        this.companyId.set(currentUser ? currentUser.companyId : '');
    }

    private get basePath(): string {
        return `companies/${this.companyId()}/customers`;
    }

    loadCustomers(page: number = 1, rows: number = 10, search: string = ''): void {
        this.loadTrigger$.next({ page, rows, search });
    }

    createCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
        return this.apiService.post<Customer>(this.basePath, customer);
    }

    updateCustomer(id: number, customer: Partial<Customer>): Observable<Customer> {
        return this.apiService.patch<Customer>(`${this.basePath}/${id}`, customer);
    }

    deleteCustomer(id: number): Observable<void> {
        return this.apiService.delete<void>(`${this.basePath}/${id}`);
    }

    getCustomerById(id: number): Observable<Customer> {
        return this.apiService.get<Customer>(`${this.basePath}/${id}`);
    }

    exportToExcel(): Observable<HttpResponse<Blob>> {
        return this.http.get(`${environment.apiUrl}/companies/${this.companyId()}/customers/export`, {
            responseType: 'blob',
            observe: 'response'
        });
    }

    getCustomerCreditStudies(customerId: number): Observable<CustomerCreditStudyResponse[]> {
        return this.apiService.get<CustomerCreditStudyResponse[]>(`${this.basePath}/${customerId}/credit-studies`);
    }
}
