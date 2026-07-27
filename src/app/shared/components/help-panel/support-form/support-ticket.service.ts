import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { CreateSupportTicketRequest, CreateSupportTicketResponse } from '@/app/types/support-ticket';

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
}
