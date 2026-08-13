import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, BehaviorSubject, of, catchError, tap, switchMap } from 'rxjs';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import { PaymentReminderResponse, PromissoryNote, PromissoryNoteDetail, PromissoryNoteListResponse } from '@/app/types/promissory-note';

interface LoadPromissoryNotesParams {
    page: number;
    rows: number;
}

const EMPTY_RESPONSE: PromissoryNoteListResponse = {
    data: [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0 }
};

@Injectable({ providedIn: 'root' })
export class PromissoryNotesService {
    private apiService = inject(ApiService);
    private authService = inject(AuthService);

    companyId = computed<string>(() => this.authService.currentProfile()?.companyId ?? '');

    private loadTrigger$ = new BehaviorSubject<LoadPromissoryNotesParams>({ page: 1, rows: 10 });

    promissoryNotes = signal<PromissoryNote[]>([]);
    loading = signal<boolean>(false);
    totalRecords = signal<number>(0);

    promissoryNotes$ = this.loadTrigger$.pipe(
        tap(() => this.loading.set(true)),
        switchMap((params) => {
            // Evita pegarle al API sin companyId (URL `companies//documents/...` → 400).
            if (!this.companyId()) {
                return of(EMPTY_RESPONSE);
            }

            return this.apiService.get<PromissoryNoteListResponse>(this.basePath, {
                params: { page: params.page, limit: params.rows }
            }).pipe(
                catchError(() => of(EMPTY_RESPONSE))
            );
        }),
        tap((response) => {
            this.promissoryNotes.set(response.data);
            this.totalRecords.set(response.meta.total);
            this.loading.set(false);
        })
    );

    private get basePath(): string {
        return `companies/${this.companyId()}/documents/promissory-notes`;
    }

    loadPromissoryNotes(page: number = 1, rows: number = 10): void {
        this.loadTrigger$.next({ page, rows });
    }

    getPromissoryNoteById(id: number): Observable<PromissoryNoteDetail> {
        return this.apiService.get<PromissoryNoteDetail>(`${this.basePath}/${id}`);
    }

    /** Envía al deudor el recordatorio de vencimiento del pagaré (correo vía backend). */
    sendPaymentReminder(id: number): Observable<PaymentReminderResponse> {
        return this.apiService.post<PaymentReminderResponse>(`${this.basePath}/${id}/payment-reminder`, {});
    }
}
