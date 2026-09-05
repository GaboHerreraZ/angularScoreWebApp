import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, shareReplay, map, Observable } from 'rxjs';
import { ApiService } from './api.service';

export type FeatureFlags = Record<string, boolean>;

/**
 * Flags del API para esconder UI. La autoridad es el backend: aquí un flag
 * apagado (o aún no cargado) solo oculta la opción, nunca autoriza nada.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagsService {
    private apiService = inject(ApiService);

    private flags$: Observable<FeatureFlags> = this.apiService
        .get<FeatureFlags>('feature-flags')
        .pipe(
            catchError(() => of({} as FeatureFlags)),
            shareReplay(1)
        );

    /** Signal para templates/computed; {} mientras carga → flags en false. */
    flags = toSignal(this.flags$, { initialValue: {} as FeatureFlags });

    isEnabled(code: string): boolean {
        return this.flags()[code] ?? false;
    }

    isEnabled$(code: string): Observable<boolean> {
        return this.flags$.pipe(map(flags => flags[code] ?? false));
    }
}
