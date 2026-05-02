import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
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

    getBasicDashboard(): Observable<BasicDashboard> {
        return this.apiService.get<BasicDashboard>(`${this.basePath}/basic`);
    }

    getAdvancedDashboard(dateFrom: string, dateTo: string): Observable<AdvancedDashboard> {
        return this.apiService.get<AdvancedDashboard>(`${this.basePath}/advanced`, {
            params: { dateFrom, dateTo }
        });
    }
}
