import { inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { BasicDashboard, AdvancedDashboard, DashboardLevel } from '@/app/types/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = signal<string>('');
    dashboardLevel = signal<DashboardLevel>('basic');
    loading = signal<boolean>(false);

    constructor() {
        const currentUser = this.authService.currentProfile();
        this.companyId.set(currentUser ? currentUser.companyId : '');
        this.dashboardLevel.set((currentUser?.permissions.dashboardLevel as DashboardLevel) ?? 'basic');
    }

    private get basePath(): string {
        return `companies/${this.companyId()}/dashboard`;
    }

    getBasicDashboard(): Observable<BasicDashboard | null> {
        this.loading.set(true);
        return this.apiService.get<BasicDashboard>(`${this.basePath}/basic`).pipe(
            catchError((error) => {
                console.error('Error al cargar dashboard básico:', error);
                return of(null);
            })
        );
    }

    getAdvancedDashboard(dateFrom: string, dateTo: string): Observable<AdvancedDashboard | null> {
        this.loading.set(true);
        return this.apiService.get<AdvancedDashboard>(`${this.basePath}/advanced`, {
            params: { dateFrom, dateTo }
        }).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error('Error al cargar dashboard avanzado:', error);
                return of(null);
            })
        );
    }
}
