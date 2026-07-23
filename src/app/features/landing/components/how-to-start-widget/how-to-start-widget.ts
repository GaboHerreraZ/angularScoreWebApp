import { Component, computed, inject, resource } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { PackDisplayCard } from '@/app/shared/components/pack-card/pack-display-card';
import { PackIncludedFeatures } from '@/app/shared/components/pack-card/pack-included-features';
import { CardCarousel } from '@/app/shared/components/card-carousel/card-carousel';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { PackOffering } from '@/app/types/onboarding';

@Component({
    standalone: true,
    selector: 'how-to-start-widget',
    imports: [ButtonModule, SkeletonModule, ScrollAnimateDirective, PackDisplayCard, PackIncludedFeatures, CardCarousel],
    templateUrl: './how-to-start-widget.html'
})
export class HowToStartWidget {
    private router = inject(Router);
    private packOfferingsService = inject(PackOfferingsService);

    /** Lo que incluye cada análisis de crédito, sin importar el pack elegido. */
    readonly features = [
        {
            icon: 'pi-sparkles',
            gradient: 'bg-linear-to-br from-violet-500 to-violet-600',
            title: 'Análisis con IA',
            description: 'Modelos que calculan el score de riesgo combinando los indicadores financieros con el comportamiento crediticio.'
        },
        {
            icon: 'pi-file-pdf',
            gradient: 'bg-linear-to-br from-blue-500 to-blue-600',
            title: 'Lectura de estados financieros',
            description: 'Sube el balance y el P&L en PDF y extraemos las cifras automáticamente, sin digitarlas a mano.'
        },
        {
            icon: 'pi-shield',
            gradient: 'bg-linear-to-br from-emerald-500 to-emerald-600',
            title: 'Validación con Datacrédito Experian',
            description: 'Contrastamos la información del cliente contra su historial real en las centrales de riesgo.'
        }
    ];

    /** Catálogo de packs de análisis de crédito que se ofrecen en el landing. */
    packsResource = resource<PackOffering[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.packOfferingsService.getPackCatalog())
    });

    /** Packs ordenados por sortOrder para una presentación consistente. */
    packs = computed<PackOffering[]>(() =>
        [...(this.packsResource.value() ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    );

    /** Pack a destacar: el del medio (plan intermedio). */
    featuredId = computed<string | null>(() => {
        const list = this.packs();
        if (!list.length) return null;
        return list[Math.floor((list.length - 1) / 2)].id;
    });

    goToRegister(): void {
        this.router.navigateByUrl('/onboarding/registro');
    }
}
