import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { FeatureFlagsService } from '@/app/core/services/feature-flags.service';

/**
 * canMatch por feature flag para rutas de CREACIÓN. Los detalles /:id no se
 * guardan: lo ya creado sigue siendo visible aunque el flag esté apagado.
 */
export const featureFlagGuard =
    (code: string, redirectTo = '/app/estudio-credito'): CanMatchFn =>
    () => {
        const featureFlags = inject(FeatureFlagsService);
        const router = inject(Router);
        return featureFlags
            .isEnabled$(code)
            .pipe(map(enabled => (enabled ? true : router.parseUrl(redirectTo))));
    };
