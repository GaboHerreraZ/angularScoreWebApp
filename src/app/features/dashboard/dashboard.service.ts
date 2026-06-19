import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { BasicDashboard, AdvancedDashboard, DashboardLevel } from '@/app/types/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    // Derivado del perfil de forma reactiva: el servicio es singleton y el perfil
    // puede no estar cargado cuando se construye (p. ej. justo tras el login/invitación).
    companyId = computed(() => this.authService.currentProfile()?.companyId ?? '');
    loading = signal<boolean>(false);

    private get basePath(): string {
        return `companies/${this.companyId()}/dashboard`;
    }

    getBasicDashboard(): Observable<BasicDashboard> {
        if (!this.companyId()) {
            return throwError(() => new Error('No hay una empresa asociada al usuario.'));
        }
        return this.apiService.get<BasicDashboard>(`${this.basePath}/basic`);
    }

    getAdvancedDashboard(dateFrom: string, dateTo: string): Observable<AdvancedDashboard> {
        if (!this.companyId()) {
            return throwError(() => new Error('No hay una empresa asociada al usuario.'));
        }
        return this.apiService.get<AdvancedDashboard>(`${this.basePath}/advanced`, {
            params: { dateFrom, dateTo }
        });
    }
}
