import { Component, computed, DestroyRef, effect, inject, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CustomTable } from '@/app/shared/components/table/table';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { DimensionConfigService } from './dimension-config.service';
import { DimensionCard } from './dimension-card/dimension-card';
import {
    CreateScoringConfigurationDto,
    dimensionAppliesTo,
    dimensionIcon,
    MIN_DIMENSION_WEIGHT,
    PersonTypeCode,
    PERSON_TYPE_TABS,
    REQUIRED_DIMENSION_CODES,
    ScoringConfiguration,
    ScoringDimension,
    STUDY_TYPE_TABS,
    TOTAL_WEIGHT
} from '@/app/types/scoring-configuration';
import { StudyTypeCode } from '@/app/types/payment-capacity';
import { TableSettings } from '@/app/types/table';

/** Fila del editor: una dimensión del catálogo con su estado editable. */
export interface DimensionRow {
    code: string;
    label: string;
    description: string;
    icon: string;
    required: boolean;
    enabled: boolean;
    weight: number;
}

/** Catálogo + config activa cargados juntos por tipo de persona. */
interface ConfigBundle {
    dimensions: ScoringDimension[];
    active: ScoringConfiguration;
}

/** Ejes de la configuración: cada combinación tiene su propia versión vigente. */
interface ConfigScope {
    personType: PersonTypeCode;
    studyType: StudyTypeCode;
}

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
    readonly studyTypeTabs = STUDY_TYPE_TABS;
    readonly minWeight = MIN_DIMENSION_WEIGHT;
    readonly totalWeight = TOTAL_WEIGHT;

    /** Tipo de persona activo. Por defecto, Persona Jurídica. */
    personType = signal<PersonTypeCode>('legalEntity');

    /** Tipo de estudio activo. Por defecto, el empresarial (con EEFF). */
    studyType = signal<StudyTypeCode>('financialStatements');

    /** El estudio de capacidad de pago solo existe para persona natural. */
    personTypeLocked = computed(() => this.studyType() === 'paymentCapacity');

    private scope = computed<ConfigScope>(() => ({
        personType: this.personType(),
        studyType: this.studyType()
    }));

    // ── Catálogo + config activa (por tipo de persona y de estudio) ────
    bundleResource = resource<ConfigBundle, ConfigScope>({
        params: () => this.scope(),
        loader: ({ params: { personType, studyType } }) => firstValueFrom(
            forkJoin({
                dimensions: this.service.getDimensions(studyType),
                active: this.service.getActive(personType, studyType)
            })
        )
    });

    // ── Historial de versiones (por tipo de persona y de estudio) ──────
    historyResource = resource<ScoringConfiguration[], ConfigScope>({
        params: () => this.scope(),
        loader: ({ params: { personType, studyType } }) =>
            firstValueFrom(this.service.getHistory(personType, studyType))
    });

    active = computed(() => this.bundleResource.value()?.active ?? null);

    // ── Edición ───────────────────────────────────────────────────────
    editing = signal<boolean>(false);
    saving = signal<boolean>(false);
    resetting = signal<boolean>(false);

    /** Filas del editor (una por dimensión aplicable y soportada). */
    rows = signal<DimensionRow[]>([]);

    /** Solo las filas habilitadas cuentan para el total y la validez. */
    enabledRows = computed(() => this.rows().filter(r => r.enabled));

    /** Suma de los pesos de las dimensiones habilitadas. */
    total = computed<number>(() => this.enabledRows().reduce((sum, r) => sum + (r.weight ?? 0), 0));

    /** Cuánto falta o sobra respecto a 100 (positivo = falta, negativo = sobra). */
    remaining = computed<number>(() => this.totalWeight - this.total());

    /** Alguna habilitada por debajo del mínimo permitido. */
    private hasBelowMin = computed<boolean>(() =>
        this.enabledRows().some(r => (r.weight ?? 0) < this.minWeight)
    );

    /**
     * Todas las obligatorias están habilitadas. Cuáles lo son depende del tipo de
     * estudio, así que manda el catálogo del backend; la constante local solo
     * cubre el caso de que una fila llegue sin la marca.
     */
    private requiredEnabled = computed<boolean>(() =>
        this.rows().every(row =>
            !(row.required || REQUIRED_DIMENSION_CODES.includes(row.code as typeof REQUIRED_DIMENSION_CODES[number]))
            || row.enabled
        )
    );

    /** Al menos una dimensión habilitada. */
    private hasEnabled = computed<boolean>(() => this.enabledRows().length > 0);

    /** El reparto es válido: hay habilitadas, obligatorias presentes, suma 100 y ninguna bajo el mínimo. */
    isValid = computed<boolean>(() =>
        this.hasEnabled() &&
        this.requiredEnabled() &&
        this.total() === this.totalWeight &&
        !this.hasBelowMin()
    );

    /** Severidad del tag/barra del total según su validez. */
    totalSeverity = computed<'success' | 'warn' | 'danger'>(() => {
        if (this.total() === this.totalWeight) return 'success';
        return this.total() > this.totalWeight ? 'danger' : 'warn';
    });

    constructor() {
        // Al cargar (o recargar) el bundle, siembra las filas del editor y sale del modo
        // edición: cambiar de tab debe mostrar la config del nuevo tipo.
        effect(() => {
            const bundle = this.bundleResource.value();
            if (bundle) {
                this.rows.set(this.buildRows(bundle));
                this.editing.set(false);
            }
        });
    }

    /** Al pasar a capacidad de pago, el tipo de persona queda fijo en natural. */
    onStudyTypeChange(value: string | number | undefined): void {
        if (value == null) return;
        const studyType = value as StudyTypeCode;
        if (studyType === 'paymentCapacity') {
            this.personType.set('naturalPerson');
        }
        this.studyType.set(studyType);
    }

    // ── Historial (tabla) ─────────────────────────────────────────────
    historyData = computed(() => {
        const rows = this.historyResource.value() ?? [];
        return rows.map(cfg => ({
            id: cfg.id,
            createdAt: cfg.createdAt ? new Date(cfg.createdAt).toLocaleString('es-CO') : '—',
            createdBy: cfg.createdByName ?? '—',
            personType: cfg.personType?.label ?? '—',
            studyType: cfg.studyType?.label ?? '—',
            status: cfg.isActive ? 'Vigente' : 'Histórica',
            dimensions: cfg.weights.length,
            detail: cfg.weights
                .slice()
                .sort((a, b) => a.dimension.sortOrder - b.dimension.sortOrder)
                .map(w => `${w.dimension.label} ${w.weight}%`)
                .join(' · ')
        }));
    });

    historyTableSettings = computed<TableSettings>(() => ({
        title: 'Historial de configuraciones',
        titleIcon: 'pi pi-history',
        columns: [
            { header: 'Fecha', field: 'createdAt', type: 'text' },
            { header: 'Modificado por', field: 'createdBy', type: 'text' },
            { header: 'Tipo de estudio', field: 'studyType', type: 'text' },
            { header: 'Tipo de persona', field: 'personType', type: 'text' },
            { header: 'Estado', field: 'status', type: 'status', severityMap: { 'Vigente': 'success', 'Histórica': 'secondary' }, defaultSeverity: 'secondary' },
            { header: 'Dim.', field: 'dimensions', type: 'text', filterable: false },
            { header: 'Detalle', field: 'detail', type: 'text', filterable: false }
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
        if (value == null || this.personTypeLocked()) return;
        this.personType.set(value as PersonTypeCode);
    }

    startEditing(): void {
        const bundle = this.bundleResource.value();
        if (bundle) this.rows.set(this.buildRows(bundle));
        this.editing.set(true);
    }

    cancelEditing(): void {
        const bundle = this.bundleResource.value();
        if (bundle) this.rows.set(this.buildRows(bundle));
        this.editing.set(false);
    }

    /** Actualiza el peso de una dimensión (desde el slider o el input numérico). */
    setWeight(code: string, value: number): void {
        this.rows.update(rows => rows.map(r => r.code === code ? { ...r, weight: value ?? 0 } : r));
    }

    /** Habilita o deshabilita una dimensión (las obligatorias no se pueden apagar). */
    setEnabled(code: string, enabled: boolean): void {
        this.rows.update(rows => rows.map(r => {
            if (r.code !== code || r.required) return r;
            // Al deshabilitar, el peso se pone en 0 para no contaminar el total.
            return { ...r, enabled, weight: enabled ? r.weight : 0 };
        }));
    }

    save(): void {
        if (!this.isValid() || this.saving()) return;

        const dto: CreateScoringConfigurationDto = {
            weights: this.enabledRows().map(r => ({ dimension: r.code, weight: r.weight }))
        };

        this.saving.set(true);
        this.service.create(this.personType(), dto, this.studyType()).pipe(
            finalize(() => this.saving.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.notification.success('Configuración de dimensiones actualizada correctamente.');
                this.editing.set(false);
                // Refresca el active (header) y el historial para reflejar la nueva versión.
                this.bundleResource.reload();
                this.historyResource.reload();
            }
        });
    }

    /** Restaura la configuración del tipo de persona activo a los valores por defecto del sistema. */
    resetDefaults(): void {
        if (this.resetting() || this.saving()) return;

        this.resetting.set(true);
        this.service.reset(this.personType(), this.studyType()).pipe(
            finalize(() => this.resetting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: () => {
                this.notification.success('Configuración restaurada a los valores predeterminados.');
                this.editing.set(false);
                // Refresca el active (header) y el historial para reflejar la nueva versión.
                this.bundleResource.reload();
                this.historyResource.reload();
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────
    /**
     * Construye las filas del editor cruzando el catálogo con la config activa:
     * solo dimensiones aplicables al tipo y soportadas por el motor; cada una queda
     * habilitada con su peso si está en el active, o deshabilitada en 0 si no.
     */
    private buildRows(bundle: ConfigBundle): DimensionRow[] {
        const personType = this.personType();
        const weightByCode = new Map(bundle.active.weights.map(w => [w.dimension.code, w.weight]));

        return bundle.dimensions
            .filter(d => d.isActive && d.supported && dimensionAppliesTo(d, personType))
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(d => {
                const enabled = weightByCode.has(d.code) || d.required;
                return {
                    code: d.code,
                    label: d.label,
                    description: d.description,
                    icon: dimensionIcon(d.code),
                    required: d.required,
                    enabled,
                    weight: weightByCode.get(d.code) ?? 0
                };
            });
    }
}
