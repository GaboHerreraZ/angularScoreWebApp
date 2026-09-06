import { Component, computed, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableColumn, TableSettings, TablePageChangeEvent, TableSearchEvent, TableActionEvent } from '@/app/types/table';
import { CreditStudyService } from './credit-study.service';
import { AuthService } from '@/app/core/services/auth.service';
import { StudyTypeSelector } from './payment-capacity/study-type-selector/study-type-selector';
import { StudyTypeCode } from '@/app/types/payment-capacity';
import { FeatureFlagsService } from '@/app/core/services/feature-flags.service';

/** Estados compartidos que según el tipo de estudio significan otra cosa. */
const STATUS_LABEL_BY_TYPE: Record<string, Record<string, string>> = {
    paymentCapacity: { pendingFinancialStatements: 'Pendiente Documentos' },
    bureauCheck: { pendingStudyAnalysis: 'Analizando', studyCompleted: 'Completada' }
};

@Component({
    selector: 'app-credit-study',
    standalone: true,
    imports: [CommonModule, CustomTable, StudyTypeSelector],
    templateUrl: './credit-study.html'
})
export class CreditStudy implements OnInit {
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);
    private featureFlags = inject(FeatureFlagsService);

    exporting = signal(false);

    /** Diálogo de elección del tipo de estudio, previo a crear uno nuevo. */
    studyTypeSelectorVisible = signal(false);

    /**
     * Filas de la tabla. Ambos tipos de estudio comparten la máquina de estados,
     * así que en los de capacidad se remapea el label: sus documentos no son
     * estados financieros y el estado del backend diría lo contrario.
     */
    rows = computed(() =>
        this.creditStudyService.creditStudies().map((study) => {
            const typeMap = STATUS_LABEL_BY_TYPE[study.studyType?.code ?? ''];
            if (!typeMap || !study.status) return study;
            const label = typeMap[study.status.code];
            return label ? { ...study, status: { ...study.status, label } } : study;
        })
    );

    /** Puede crear si tiene saldo en ALGUNA bolsa (estudios o consultas). */
    private canAddCreditStudy = computed(() => {
        const perms = this.authService.currentProfile()?.permissions;
        const canStudies = (perms?.canAddCreditStudy ?? false) && (perms?.hasCredits ?? false);
        const canBureau = this.featureFlags.isEnabled('bureauCheck') && (perms?.hasBureauCredits ?? false);
        return canStudies || canBureau;
    });

    tableSettings = computed<TableSettings>(() => ({
        title: 'Gestión de Estudios de Crédito',
        titleIcon: 'pi pi-credit-card',
        subtitle: 'Crea y consulta los análisis de viabilidad crediticia de tus clientes.',
        headerVariant: 'page',
        dataKey: 'customerId',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        searchPlaceholder: 'Buscar estudios de crédito...',
        emptyMessage: 'No se encontraron estudios de crédito.',
        emptyState: {
            icon: 'pi pi-credit-card',
            title: 'Aún no tienes estudios de crédito',
            description: 'Crea tu primer estudio para analizar la capacidad financiera de un cliente.',
            ...(this.canAddCreditStudy() ? { actionLabel: 'Crear primer estudio', actionIcon: 'pi pi-plus' } : {})
        },
        ...(this.canAddCreditStudy() ? {
            addButton: {
                label: 'Nuevo Estudio',
                icon: 'pi pi-plus',
                severity: 'success' as const
            }
        } : {}),
        exportButton: {
            label: 'Exportar',
            icon: 'pi pi-file-excel',
            severity: 'secondary' as const,
            loading: this.exporting()
        },
        actions: [
            { id: 'view', icon: 'pi pi-eye', severity: 'info', tooltip: 'Ver detalle' }
        ],
        actionsHeader: 'Acciones',
        columns: <TableColumn[]>[
            {
                header: 'Cliente',
                field: 'customer.businessName',
                type: 'text',
                minWidth: '14rem'
            },
            {
                header: 'Tipo',
                field: 'studyType.label',
                type: 'status',
                minWidth: '11rem',
                severityMap: {
                    'Estudio empresarial': 'info',
                    'Estudio de capacidad de pago': 'success',
                    'Consulta de riesgo crediticio': 'warn'
                },
                defaultSeverity: 'secondary',
                filterOptions: [
                    { label: 'Estudio empresarial', value: 'Estudio empresarial' },
                    { label: 'Estudio de capacidad de pago', value: 'Estudio de capacidad de pago' },
                    { label: 'Consulta de riesgo crediticio', value: 'Consulta de riesgo crediticio' }
                ]
            },
            {
                header: 'Cupo Solicitado',
                field: 'requestedCreditLine',
                type: 'currency',
                currencyCode: 'COP',
                minWidth: '12rem'
            },
            {
                header: 'Plazo (días)',
                field: 'requestedTerm',
                type: 'number',
                minWidth: '10rem'
            },
            {
                header: 'Fecha del Estudio',
                field: 'studyDate',
                type: 'date',
                minWidth: '10rem'
            },
            {
                header: 'Estado',
                field: 'status.label',
                type: 'status',
                minWidth: '8rem',
                severityMap: {
                    'En Revisión': 'info',
                    "Estudio Realizado": "success"
                },
                defaultSeverity: 'info',
                filterOptions: [
                    { label: 'En Revisión', value: 'En Revisión' },
                    { label: 'Estudio Realizado', value: 'Estudio Realizado' },
                ]
            },
            {
                header: 'Score',
                field: 'result.score',
                type: 'score',
                minWidth: '6rem'
            },
            {
                header: 'Viabilidad',
                field: 'result.statusLabel',
                type: 'status',
                minWidth: '10rem',
                severityMap: {
                    'Viable': 'success',
                    'Viable con condiciones': 'warn',
                    'No viable': 'danger'
                },
                defaultSeverity: 'secondary',
                filterOptions: [
                    { label: 'Viable', value: 'Viable' },
                    { label: 'Viable con condiciones', value: 'Viable con condiciones' },
                    { label: 'No viable', value: 'No viable' }
                ]
            }
        ]
    }));

    constructor(
        public creditStudyService: CreditStudyService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Activate the service pipe so its taps write into the signals used by the view
        this.creditStudyService.creditStudies$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onPageChange(event: TablePageChangeEvent): void {
        this.creditStudyService.loadCreditStudies(event.page, event.rows);
    }

    onSearch(event: TableSearchEvent): void {
        this.creditStudyService.loadCreditStudies(1, 10, event.query);
    }

    onActionClick(event: TableActionEvent): void {
        if (event.action === 'view') {
            this.router.navigate([this.detailRoute(event.row['studyType']?.code), event.row.id]);
        }
    }

    onAdd(): void {
        // Con un solo tipo habilitado no hay elección que hacer: directo al empresarial.
        const hasOptionalTypes =
            this.featureFlags.isEnabled('paymentCapacity') || this.featureFlags.isEnabled('bureauCheck');
        if (!hasOptionalTypes) {
            this.router.navigate([this.detailRoute('financialStatements')]);
            return;
        }
        this.studyTypeSelectorVisible.set(true);
    }

    /** El tipo elegido en el diálogo decide a qué formulario de creación se va. */
    onStudyTypeSelected(studyType: StudyTypeCode): void {
        this.router.navigate([this.detailRoute(studyType)]);
    }

    private detailRoute(studyType?: string): string {
        const routes: Record<string, string> = {
            paymentCapacity: '/app/estudio-credito/estudio-capacidad',
            bureauCheck: '/app/estudio-credito/consulta-riesgo'
        };
        return routes[studyType ?? ''] ?? '/app/estudio-credito/detalle-estudio';
    }

    onExport(): void {
        this.exporting.set(true);
        this.creditStudyService.exportToExcel().pipe(
            finalize(() => this.exporting.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((response) => {
            const blob = response.body;
            if (!blob) return;

            const fileName = this.extractFileName(response.headers.get('Content-Disposition'))
                ?? `estudios-credito-${new Date().toISOString().slice(0, 10)}.xlsx`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            window.URL.revokeObjectURL(url);
        });
    }

    private extractFileName(contentDisposition: string | null): string | null {
        if (!contentDisposition) return null;
        const match = /filename="?([^"]+)"?/.exec(contentDisposition);
        return match?.[1] ?? null;
    }
}
