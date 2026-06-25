import { computed, inject, Injectable } from '@angular/core';
import { Observable, of, catchError, firstValueFrom } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    CreateSupportTicketRequest,
    CreateSupportTicketResponse,
    RelatedEntityOption
} from '@/app/types/support-ticket';

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    // Reactivo: el perfil puede no estar cargado al construir el singleton.
    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private get basePath(): string {
        return `companies/${this.companyId()}/support-tickets`;
    }

    createTicket(ticket: CreateSupportTicketRequest): Observable<CreateSupportTicketResponse> {
        return this.apiService.post<CreateSupportTicketResponse>(this.basePath, ticket);
    }

    /** Opciones del selector "registro relacionado". Falla en silencio ([]). */
    async getRelatedEntityOptions(
        entityType: 'credit_study' | 'customer' | 'payment',
        search = ''
    ): Promise<RelatedEntityOption[]> {
        if (!this.companyId()) return [];

        if (entityType === 'credit_study') {
            return this.fetchCreditStudyOptions(search);
        }
        if (entityType === 'customer') {
            return this.fetchCustomerOptions(search);
        }
        // 'payment' aún no tiene listado ligero.
        return [];
    }

    private async fetchCreditStudyOptions(search: string): Promise<RelatedEntityOption[]> {
        const params: Record<string, string | number> = { page: 1, limit: 25 };
        if (search) params['search'] = search;

        const res = await firstValueFrom(
            this.apiService
                .get<{ data: any[]; total: number }>(`companies/${this.companyId()}/credit-studies`, { params })
                .pipe(catchError(() => of({ data: [], total: 0 })))
        );

        return res.data.map((s) => ({
            id: String(s.id),
            label: this.creditStudyLabel(s)
        }));
    }

    private async fetchCustomerOptions(search: string): Promise<RelatedEntityOption[]> {
        const params: Record<string, string | number> = { page: 1, limit: 25 };
        if (search) params['search'] = search;

        const res = await firstValueFrom(
            this.apiService
                .get<{ data: any[]; total: number }>(`companies/${this.companyId()}/customers`, { params })
                .pipe(catchError(() => of({ data: [], total: 0 })))
        );

        return res.data.map((c) => ({
            id: String(c.id),
            label: `${c.businessName ?? 'Cliente'} — ${c.identificationNumber ?? ''}`.trim()
        }));
    }

    private creditStudyLabel(s: any): string {
        const customerName = s.customer?.businessName ? ` — ${s.customer.businessName}` : '';
        const status = s.status?.label ? ` (${s.status.label})` : '';
        return `Estudio #${s.id}${customerName}${status}`;
    }
}
