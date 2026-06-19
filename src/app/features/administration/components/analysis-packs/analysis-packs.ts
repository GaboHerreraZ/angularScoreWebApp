import { Component, computed, DestroyRef, inject, resource, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { AnalysisPacksService } from '@/app/shared/services/analysis-packs.service';
import { PackOfferingsService } from '@/app/shared/services/pack-offerings.service';
import { PackDisplayCard } from '@/app/shared/components/pack-card/pack-display-card';
import { EpaycoCheckout } from '@/app/shared/components/epayco-checkout/epayco-checkout';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { AnalysisPack, AnalysisPackConsumption } from '@/app/types/analysis-pack';
import { PackOffering } from '@/app/types/onboarding';
import { TagSeverity } from '@/app/types/table';

/** Ruta a la que ePayco debe volver tras el pago iniciado desde esta pantalla. */
const REDIRECT_PATH = '/app/administracion/analisis-credito';

@Component({
    selector: 'app-analysis-packs',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, ButtonModule, TooltipModule, SkeletonModule, DialogModule, PackDisplayCard, EpaycoCheckout],
    templateUrl: './analysis-packs.html'
})
export class AnalysisPacks {
    private destroyRef = inject(DestroyRef);
    private service = inject(AnalysisPacksService);
    private packOfferingsService = inject(PackOfferingsService);
    private authService = inject(AuthService);
    private notification = inject(NotificationService);
    private router = inject(Router);

    readonly rows = 5;

    packs = signal<AnalysisPack[]>([]);
    totalRecords = signal<number>(0);
    loading = signal<boolean>(false);
    expandedRows: Record<string, boolean> = {};

    // ── Compra de pack ────────────────────────────────────────────────
    private checkout = viewChild.required(EpaycoCheckout);

    selectedPack = signal<PackOffering | null>(null);
    summaryVisible = signal<boolean>(false);
    purchasing = signal<boolean>(false);
    sessionId = signal<string>('');

    /** Análisis disponibles hoy (suma de los activos no consumidos), según el perfil. */
    currentAvailable = computed<number>(() => this.authService.currentProfile()?.permissions?.availableCredits ?? 0);

    /** Total de análisis tras la compra: los disponibles actuales más los del nuevo pack. */
    totalAfterPurchase = computed<number>(() => this.currentAvailable() + (this.selectedPack()?.quantity ?? 0));

    // ── Catálogo de packs disponibles para compra ─────────────────────
    packsCatalogResource = resource<PackOffering[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.packOfferingsService.getPackCatalog())
    });

    /** Catálogo ordenado por sortOrder para una presentación consistente. */
    catalog = computed<PackOffering[]>(() =>
        [...(this.packsCatalogResource.value() ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    );

    onLazyLoad(event: TableLazyLoadEvent): void {
        const first = event.first ?? 0;
        const rows = event.rows ?? this.rows;
        this.loadPacks(Math.floor(first / rows) + 1);
    }

    private loadPacks(page: number): void {
        this.loading.set(true);
        this.service.getPacksWithConsumptions(page, this.rows)
            .pipe(
                finalize(() => this.loading.set(false)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => {
                this.expandedRows = {};
                this.packs.set(response.data);
                this.totalRecords.set(response.meta.total);
            });
    }

    packStatusSeverity(label: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            'Activa': 'success',
            'Agotada': 'secondary',
            'Vencida': 'danger',
            'Pendiente': 'warn'
        };
        return map[label] ?? 'info';
    }

    consumptionStatusSeverity(label: string): TagSeverity {
        const map: Record<string, TagSeverity> = {
            'Aprobado': 'success',
            'En estudio': 'info',
            'Rechazado': 'danger'
        };
        return map[label] ?? 'info';
    }

    paymentEventSeverity(label: string): TagSeverity {
        const value = label.toLowerCase();
        if (value.includes('aprobada')) return 'success';
        if (value.includes('pendiente') || value.includes('proceso')) return 'warn';
        if (value.includes('rechazada') || value.includes('fallida') || value.includes('declinada')) return 'danger';
        return 'info';
    }

    paymentSeverity(reason: string): TagSeverity {
        const value = reason.toLowerCase();
        if (value.includes('aprobada') || value.startsWith('00')) return 'success';
        if (value.includes('pendiente')) return 'warn';
        if (value.includes('rechazada') || value.includes('fallida') || value.includes('declinada')) return 'danger';
        return 'info';
    }

    remaining(pack: AnalysisPack): number {
        return pack.quantityPurchased - pack.quantityConsumed;
    }

    isPendingPayment(pack: AnalysisPack): boolean {
        return pack.status.code === 'pending_payment';
    }

    /**
     * Reintenta el pago de un pack pendiente reusando el modal de compra. Busca
     * la oferta en el catálogo por packOfferingId para mostrar el resumen; si ya
     * no está ofertada, no se puede reintentar desde aquí.
     */
    retryPayment(pack: AnalysisPack): void {
        const offering = this.catalog().find((o) => o.id === pack.packOfferingId);
        if (!offering) {
            this.notification.error('El paquete ya no está disponible para reintentar el pago.');
            return;
        }
        this.onBuyPack(offering);
    }

    viewCreditStudy(consumption: AnalysisPackConsumption): void {
        this.router.navigate(['/app/estudio-credito/detalle-estudio', consumption.creditStudyId]);
    }

    viewCustomer(consumption: AnalysisPackConsumption): void {
        this.router.navigate(['/app/clientes/detalle-cliente', consumption.customerId]);
    }

    onBuyPack(pack: PackOffering): void {
        this.selectedPack.set(pack);
        this.summaryVisible.set(true);
    }

    confirmPurchase(): void {
        const pack = this.selectedPack();
        if (!pack || this.purchasing()) return;

        this.purchasing.set(true);
        this.service.purchasePack({ packOfferingId: pack.id, redirectPath: REDIRECT_PATH }).pipe(
            finalize(() => this.purchasing.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (res) => {
                this.summaryVisible.set(false);
                this.sessionId.set(res.sessionId);
                // Pasamos el id directo: el input aún no se propagó en este tick.
                this.checkout().open(res.sessionId);
            },
            error: (error: HttpErrorResponse) => {
                if (error.status === 404) {
                    this.notification.error('El paquete seleccionado ya no está disponible.');
                } else {
                    this.notification.error('No se pudo iniciar el pago. Inténtalo de nuevo en unos minutos.');
                }
            }
        });
    }

    onCheckoutError(): void {
        this.notification.error('No se pudo abrir la pasarela de pago. Inténtalo de nuevo.');
    }
}
