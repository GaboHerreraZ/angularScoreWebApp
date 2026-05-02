import { Component, computed, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TablePageChangeEvent, TableSearchEvent, TableActionEvent } from '@/app/types/table';
import { CreditStudyService } from './credit-study.service';
import { AuthService } from '@/app/core/services/auth.service';

@Component({
    selector: 'app-credit-study',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './credit-study.html'
})
export class CreditStudy implements OnInit {
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);

    exporting = signal(false);

    private canExportExcel = computed(() => this.authService.currentProfile()?.permissions?.canExportExcel ?? false);
    private canAddCreditStudy = computed(() => this.authService.currentProfile()?.permissions?.canAddCreditStudy ?? false);

    tableSettings = computed<TableSettings>(() => ({
        title: 'Gestión de Estudios de Crédito',
        dataKey: 'customerId',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        searchPlaceholder: 'Buscar estudios de crédito...',
        emptyMessage: 'No se encontraron estudios de crédito.',
        ...(this.canAddCreditStudy() ? {
            addButton: {
                label: 'Nuevo Estudio',
                icon: 'pi pi-plus',
                severity: 'success' as const
            }
        } : {}),
        ...(this.canExportExcel() ? {
            exportButton: {
                label: 'Exportar',
                icon: 'pi pi-file-excel',
                severity: 'secondary' as const,
                loading: this.exporting()
            }
        } : {}),
        actions: [
            { id: 'edit', icon: 'pi pi-pencil', severity: 'info', tooltip: 'Editar' },
            { id: 'delete', icon: 'pi pi-trash', severity: 'danger', tooltip: 'Eliminar' }
        ],
        actionsHeader: 'Acciones',
        columns: [
            {
                header: 'Cliente',
                field: 'customer.businessName',
                type: 'text',
                minWidth: '14rem'
            },
            {
                header: 'Cupo Solicitado',
                field: 'requestedCreditLine',
                type: 'currency',
                currencyCode: 'COP',
                minWidth: '12rem'
            },
            {
                header: 'Plazo (meses)',
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
        switch (event.action) {
            case 'edit':
                this.router.navigate(['/app/estudio-credito/detalle-estudio', event.row.id]);
                break;
            case 'delete':
                console.log('Eliminar estudio de crédito:', event.row);
                break;
        }
    }

    onAdd(): void {
        this.router.navigate(['/app/estudio-credito/detalle-estudio']);
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
