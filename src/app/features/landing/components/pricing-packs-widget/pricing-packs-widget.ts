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
import { SupabaseService } from '@/app/core/services/supabase.service';
import { PRESELECTED_PACK_KEY } from '@/app/core/constants/storage-keys';
import { PackOffering } from '@/app/types/onboarding';


@Component({
    standalone: true,
    selector: 'pricing-packs-widget',
    imports: [ButtonModule, SkeletonModule, ScrollAnimateDirective, PackDisplayCard, PackIncludedFeatures, CardCarousel],
    templateUrl: './pricing-packs-widget.html'
})
export class PricingPacksWidget {
    private router = inject(Router);
    private packOfferingsService = inject(PackOfferingsService);
    private supabaseService = inject(SupabaseService);

    /** Catálogo de packs de análisis de crédito que se ofrecen en la página. */
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

    buyPack(pack: PackOffering): void {
        sessionStorage.setItem(PRESELECTED_PACK_KEY, pack.id);
        const target = this.supabaseService.isAuthenticated() ? '/onboarding/registrar-empresa' : '/onboarding/registro';
        this.router.navigateByUrl(target);
    }

    goToRegister(): void {
        this.router.navigateByUrl('/onboarding/registro');
    }
}
