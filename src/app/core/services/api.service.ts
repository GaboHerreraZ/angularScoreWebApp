import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@/environments/environment';

export interface ApiRequestOptions {
    params?: Record<string, string | number | boolean>;
    headers?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
            params: this.buildParams(options?.params),
            headers: options?.headers
        });
    }

    post<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, {
            params: this.buildParams(options?.params),
            headers: options?.headers
        });
    }

    put<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, {
            params: this.buildParams(options?.params),
            headers: options?.headers
        });
    }

    patch<T>(endpoint: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body, {
            params: this.buildParams(options?.params),
            headers: options?.headers
        });
    }

    delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, {
            params: this.buildParams(options?.params),
            headers: options?.headers
        });
    }

    private buildParams(params?: Record<string, string | number | boolean>): HttpParams | undefined {
        if (!params) return undefined;

        let httpParams = new HttpParams();
        for (const [key, value] of Object.entries(params)) {
            httpParams = httpParams.set(key, String(value));
        }
        return httpParams;
    }
}
