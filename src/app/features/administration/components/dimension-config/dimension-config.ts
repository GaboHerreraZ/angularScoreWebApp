import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CustomTable } from '@/app/shared/components/table/table';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { DimensionConfigService } from './dimension-config.service';
import { DimensionCard } from './dimension-card/dimension-card';
import {
    dimensionsFor,
    MIN_DIMENSION_WEIGHT,
    PersonTypeCode,
    PERSON_TYPE_TABS,
    ScoringConfiguration,
    ScoringWeightKey,
    ScoringWeights,
    SCORING_DIMENSIONS,
    TOTAL_WEIGHT
} from '@/app/types/scoring-configuration';
import { TableSettings } from '@/app/types/table';

@Component({
    selector: 'app-dimension-config',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        CardModule,
        TabsModule,
        TagModule,
        SkeletonModule,
        CustomTable,
        DimensionCard
    ],
    templateUrl: './dimension-config.html'
})
export class DimensionConfig {
    private destroyRef = inject(DestroyRef);
    private service = inject(DimensionConfigService);
    private notification = inject(NotificationService);

    readonly personTypeTabs = PERSON_TYPE_TABS;
    readonly minWeight = MIN_DIMENSION_WEIGHT;
    readonly totalWeight = TOTAL_WEIGHT;

    /** Tipo de persona activo. Por defecto, Persona Jurídica. */
    personType = signal<PersonTypeCode>('legalEntity');

    /** Dimensiones que aplican al tipo de persona activo (Veracidad se excluye en PN). */
    dimensions = computed(() => dimensionsFor(this.personType()));

    // ── Config activa (por tipo de persona) ───────────────────────────
    activeResource = resource<ScoringConfiguration, PersonTypeCode>({
        params: () => this.personType(),
        loader: ({ params: personType }) => firstValueFrom(this.service.getActive(personType))
    });

    // ── Historial de versiones (por tipo de persona) ──────────────────
    historyResource = resource<ScoringConfiguration[], PersonTypeCode>({
        params: () => this.personType(),
        loader: ({ params: personType }) => firstValueFrom(this.service.getHistory(personType))
    });

    // ── Edición ───────────────────────────────────────────────────────
    editing = signal<boolean>(false);
    saving = signal<boolean>(false);

    /** Pesos que se están editando, indexados por clave de dimensión. */
    weights = signal<ScoringWeights>(this.emptyWeights());

    /** Suma actual de los pesos de las dimensiones visibles para el tipo activo. */
    total = computed<number>(() =>
        this.dimensions().reduce((sum, d) => sum + (this.weights()[d.key] ?? 0), 0)
    );

    /** Cuánto falta o sobra respecto a 100 (positivo = falta, negativo = sobra). */
    remaining = computed<number>(() => this.totalWeight - this.total());

    /** Alguna dimensión visible por debajo del mínimo permitido. */
    private hasBelowMin = computed<boolean>(() =>
        this.dimensions().some(d => (this.weights()[d.key] ?? 0) < this.minWeight)
    );

    /** El reparto es válido: suma exactamente 100 y ninguna dimensión bajo el mínimo. */
    isValid = computed<boolean>(() => this.total() === this.totalWeight && !this.hasBelowMin());

    /** Severidad del tag/barra del total según su validez. */
    totalSeverity = computed<'success' | 'warn' | 'danger'>(() => {
        if (this.total() === this.totalWeight) return 'success';
        return this.total() > this.totalWeight ? 'danger' : 'warn';
    });

    constructor() {
        // Al cargar (o recargar) la config activa, siembra los pesos del editor y sale
        // del modo edición: cambiar de tab debe mostrar la config del nuevo tipo.
        effect(() => {
            const active = this.activeResource.value();
            if (active) {
                this.weights.set(this.pickWeights(active));
                this.editing.set(false);
            }
        });
    }

    // ── Historial (tabla) ─────────────────────────────────────────────
    historyData = computed(() => {
        const rows = this.historyResource.value() ?? [];
        return rows.map(cfg => ({
            id: cfg.id,
            createdAt: cfg.createdAt ? new Date(cfg.createdAt).toLocaleString('es-CO') : '—',
            createdBy: cfg.createdByName ?? '—',
            personType: cfg.personType?.label ?? '—',
            status: cfg.isActive ? 'Vigente' : 'Histórica',
            weightFinancialHealth: `${cfg.weightFinancialHealth}%`,
            weightPaymentCapacity: `${cfg.weightPaymentCapacity}%`,
            weightTermCoherence: `${cfg.weightTermCoherence}%`,
            weightCreditLineAdequacy: `${cfg.weightCreditLineAdequacy}%`,
            weightCapitalExposure: `${cfg.weightCapitalExposure}%`,
            weightVeracity: `${cfg.weightVeracity}%`,
            weightCentralRisk: `${cfg.weightCentralRisk}%`
        }));
    });

    historyTableSettings = computed<TableSettings>(() => ({
        title: 'Historial de configuraciones',
        titleIcon: 'pi pi-history',
        columns: [
            { header: 'Fecha', field: 'createdAt', type: 'text' },
            { header: 'Modificado por', field: 'createdBy', type: 'text' },
            { header: 'Tipo de persona', field: 'personType', type: 'text' },
            { header: 'Estado', field: 'status', type: 'status', severityMap: { 'Vigente': 'success', 'Histórica': 'secondary' }, defaultSeverity: 'secondary' },
            { header: 'Salud fin.', field: 'weightFinancialHealth', type: 'text', filterable: false },
            { header: 'Cap. pago', field: 'weightPaymentCapacity', type: 'text', filterable: false },
            { header: 'Plazos', field: 'weightTermCoherence', type: 'text', filterable: false },
            { header: 'Cupo', field: 'weightCreditLineAdequacy', type: 'text', filterable: false },
            { header: 'Capital', field: 'weightCapitalExposure', type: 'text', filterable: false },
            { header: 'Veracidad', field: 'weightVeracity', type: 'text', filterable: false },
            { header: 'Central', field: 'weightCentralRisk', type: 'text', filterable: false }
        ],
        rows: 5,
        rowsPerPageOptions: [5, 10, 25],
        showGridlines: true,
        showSearch: false,
        showColumnFilters: false,
        emptyMessage: 'Aún no hay versiones anteriores de la configuración.'
    }));

    // ── Acciones ──────────────────────────────────────────────────────
    onPersonTypeChange(value: string | number | undefined): void {
        if (value == null) return;
        this.personType.set(value as PersonTypeCode);
    }

    startEditing(): void {
        const active = this.activeResource.value();
        if (active) this.weights.set(this.pickWeights(active));
        this.editing.set(true);
    }

    cancelEditing(): void {
        const active = this.activeResource.value();
        if (active) this.weights.set(this.pickWeights(active));
        this.editing.set(false);
    }

    /** Actualiza el peso de una dimensión (desde el slider o el input numérico). */
    setWeight(key: ScoringWeightKey, value: number): void {
        this.weights.update(w => ({ ...w, [key]: value ?? 0 }));
    }

    save(): void {
        if (!this.isValid() || this.saving()) return;

        // Solo se envían las dimensiones que aplican al tipo; las excluidas (Veracidad
        // en PN) se mandan en 0 para que el backend las persista consistentemente.
        const payload = this.buildPayload();

        this.saving.set(true);
        this.service.create(this.personType(), payload).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.notification.success('Configuración de dimensiones actualizada correctamente.');
                this.editing.set(false);
                // Refresca el active (header) y el historial para reflejar la nueva versión.
                this.activeResource.reload();
                this.historyResource.reload();
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────
    private emptyWeights(): ScoringWeights {
        return SCORING_DIMENSIONS.reduce((acc, d) => {
            acc[d.key] = 0;
            return acc;
        }, {} as ScoringWeights);
    }

    private pickWeights(cfg: ScoringConfiguration): ScoringWeights {
        return SCORING_DIMENSIONS.reduce((acc, d) => {
            acc[d.key] = cfg[d.key] ?? 0;
            return acc;
        }, {} as ScoringWeights);
    }

    /** Pesos a enviar: los de las dimensiones visibles; las no aplicables van en 0. */
    private buildPayload(): ScoringWeights {
        const visible = new Set(this.dimensions().map(d => d.key));
        return SCORING_DIMENSIONS.reduce((acc, d) => {
            acc[d.key] = visible.has(d.key) ? (this.weights()[d.key] ?? 0) : 0;
            return acc;
        }, {} as ScoringWeights);
    }
}
