import { inject, Injectable, Signal, signal } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, tap, catchError, of, map } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { Customer } from '@/app/types/customer';
import { CustomerCreditStudyResponse } from '@/app/types/credit-study';
import { AuthService } from '@/app/core/services/auth.service';
import { ParameterService } from '@/app/core/services/parameter.service';
import { toSignal } from '@angular/core/rxjs-interop';

interface LoadCustomersParams {
    page: number;
    rows: number;
    search: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
    companyId =  signal<string>(''); // TODO: obtener dinámicamente

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
                catchError((error) => {
                    console.error('Error al cargar clientes:', error);
                    return of({ data: [] as Customer[], total: 0 });
                })
            );
        }),
        tap((response) => {
            this.customers.set(response.data);
            this.totalRecords.set(response.total);
            this.loading.set(false);
        })
    );

    constructor(private apiService: ApiService) {
            const currentUser = this.authSerive.currentProfile();
            const { userCompanies } = currentUser ?? {};
            this.companyId.set(userCompanies ? userCompanies[0].companyId : '');
    }

    private get basePath(): string {
        return `companies/${this.companyId()}/customers`;
    }

    loadCustomers(page: number = 1, rows: number = 10, search: string = ''): void {
        this.loadTrigger$.next({ page, rows, search });
    }

    createCustomer(customer: Omit<Customer, 'id'>): Observable<{ success: boolean; error?: string; data?: Customer }> {
        return this.apiService.post<Customer>(this.basePath, customer).pipe(
            map((response) => ({ success: true, data: response })),
            catchError((error) => {
                console.error('Error al crear cliente:', error);
                return of({ success: false, error: 'Error al crear el cliente' });
            })
        );
    }

    updateCustomer(id: number, customer: Partial<Customer>): Observable<{ success: boolean; error?: string }> {
        return this.apiService.patch<Customer>(`${this.basePath}/${id}`, customer).pipe(
            map(() => ({ success: true })),
            catchError((error) => {
                console.error('Error al actualizar cliente:', error);
                return of({ success: false, error: 'Error al actualizar el cliente' });
            })
        );
    }

    deleteCustomer(id: number): Observable<{ success: boolean; error?: string }> {
        return this.apiService.delete(`${this.basePath}/${id}`).pipe(
            map(() => ({ success: true })),
            catchError((error) => {
                console.error('Error al eliminar cliente:', error);
                return of({ success: false, error: 'Error al eliminar el cliente' });
            })
        );
    }

    getCustomerById(id: number): Observable<Customer | null> {
        return this.apiService.get<Customer>(`${this.basePath}/${id}`).pipe(
            catchError((error) => {
                console.error('Error al obtener cliente:', error);
                return of(null);
            })
        );
    }

    getCustomerCreditStudies(
        customerId: number,
    ): Observable<CustomerCreditStudyResponse[]> {

        return this.apiService.get<CustomerCreditStudyResponse[]>(
            `${this.basePath}/${customerId}/credit-studies`,
        ).pipe(
            catchError((error) => {
                console.error('Error al cargar estudios de crédito del cliente:', error);
                return of([]);
            })
        );
    }
}
