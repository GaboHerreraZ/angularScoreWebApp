import { Component, computed, inject, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { AnalyticsService } from '@/app/core/services/analytics.service';
import { FeatureFlagsService } from '@/app/core/services/feature-flags.service';
import { PRESELECTED_PACK_KEY } from '@/app/core/constants/storage-keys';
import { PackOffering } from '@/app/types/onboarding';


@Component({
    standalone: true,
    selector: 'pricing-packs-widget',
    imports: [CommonModule, ButtonModule, SkeletonModule, ScrollAnimateDirective, PackDisplayCard, PackIncludedFeatures, CardCarousel],
    templateUrl: './pricing-packs-widget.html'
})
export class PricingPacksWidget {
    private router = inject(Router);
    private packOfferingsService = inject(PackOfferingsService);
    private supabaseService = inject(SupabaseService);
    private analytics = inject(AnalyticsService);
    private featureFlags = inject(FeatureFlagsService);

    /** Catálogo completo (ambos productos) que se ofrece en la página. */
    packsResource = resource<PackOffering[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.packOfferingsService.getPackCatalog())
    });

    // ── Un tab por producto: estudios y consultas no comparten precio ──
    activeTab = signal<'creditStudy' | 'bureauCheck'>('creditStudy');

    private sorted = computed<PackOffering[]>(() =>
        [...(this.packsResource.value() ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    );

    studyPacks = computed<PackOffering[]>(() =>
        this.sorted().filter((p) => (p.product?.code ?? 'creditStudy') !== 'bureauCheck')
    );

    bureauPacks = computed<PackOffering[]>(() =>
        this.sorted().filter((p) => p.product?.code === 'bureauCheck')
    );

    /** El tab de consultas solo existe con ofertas cotizables Y el flag encendido. */
    showBureauTab = computed<boolean>(
        () => this.bureauPacks().length > 0 && this.featureFlags.isEnabled('bureauCheck')
    );

    /** Packs del tab activo, ya ordenados. */
    packs = computed<PackOffering[]>(() =>
        this.activeTab() === 'bureauCheck' ? this.bureauPacks() : this.studyPacks()
    );

    /** Pack a destacar: el del medio (plan intermedio) del tab activo. */
    featuredId = computed<string | null>(() => {
        const list = this.packs();
        if (!list.length) return null;
        return list[Math.floor((list.length - 1) / 2)].id;
    });

    /** Franja "qué incluye" del producto de consultas. */
    readonly bureauIncludedFeatures = [
        { icon: 'pi-shield', label: 'Consulta en centrales de riesgo' },
        { icon: 'pi-file-edit', label: 'Autorización del titular gestionada en la plataforma' },
        { icon: 'pi-sparkles', label: 'Análisis IA con red flags y señales a favor' },
        { icon: 'pi-file-export', label: 'Informe PDF descargable' }
    ];

    buyPack(pack: PackOffering): void {
        this.analytics.buyPackClick(pack.id, pack.name);
        sessionStorage.setItem(PRESELECTED_PACK_KEY, pack.id);
        const target = this.supabaseService.isAuthenticated() ? '/onboarding/registrar-empresa' : '/onboarding/registro';
        this.router.navigateByUrl(target);
    }

    goToRegister(): void {
        this.router.navigateByUrl('/onboarding/registro');
    }
}
