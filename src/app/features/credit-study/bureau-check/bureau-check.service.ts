import { computed, inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '@/app/core/services/api.service';
import { AuthService } from '@/app/core/services/auth.service';
import {
    BureauCheckDetail,
    CreateBureauCheckPayload,
    CreateBureauCheckResponse
} from '@/app/types/bureau-check';

/** Endpoints propios de la consulta de riesgo (companies/:companyId/bureau-checks). */
@Injectable({ providedIn: 'root' })
export class BureauCheckService {
    private apiService = inject(ApiService);
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private companyId = computed(() => this.authService.currentProfile()?.companyId ?? '');
    private get basePath(): string {
        return `companies/${this.companyId()}/bureau-checks`;
    }

    create(payload: CreateBureauCheckPayload): Observable<CreateBureauCheckResponse> {
        return this.apiService.post<CreateBureauCheckResponse>(this.basePath, payload);
    }

    perform(id: string): Observable<BureauCheckDetail> {
        return this.apiService.post<BureauCheckDetail>(`${this.basePath}/${id}/perform`, {});
    }

    getDetail(id: string): Observable<BureauCheckDetail> {
        return this.apiService.get<BureauCheckDetail>(`${this.basePath}/${id}`);
    }

    downloadPdf(id: string): Observable<HttpResponse<Blob>> {
        return this.http.get(`${environment.apiUrl}/${this.basePath}/${id}/pdf`, {
            responseType: 'blob',
            observe: 'response'
        });
    }
}
