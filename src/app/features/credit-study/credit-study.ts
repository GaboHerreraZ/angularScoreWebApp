import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TablePageChangeEvent, TableSearchEvent, TableActionEvent } from '@/app/types/table';
import { CreditStudyService } from './credit-study.service';

@Component({
    selector: 'app-credit-study',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './credit-study.html'
})
export class CreditStudy implements OnInit {
    private destroyRef = inject(DestroyRef);
    tableSettings: TableSettings = {
        title: 'Gestión de Estudios de Crédito',
        dataKey: 'customerId',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        searchPlaceholder: 'Buscar estudios de crédito...',
        emptyMessage: 'No se encontraron estudios de crédito.',
        addButton: {
            label: 'Nuevo Estudio',
            icon: 'pi pi-plus',
            severity: 'success'
        },
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
                header: 'Cupo Mensual Solicitado',
                field: 'requestedMonthlyCreditLine',
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
    };

    constructor(
        public creditStudyService: CreditStudyService,
        private router: Router
    ) {}

    ngOnInit(): void {
        // Suscribirse al observable para iniciar la carga de datos
        this.creditStudyService.creditStudies$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();

        // Trigger inicial de carga
        this.creditStudyService.loadCreditStudies();
    }

    onPageChange(event: TablePageChangeEvent): void {
        this.creditStudyService.loadCreditStudies(event.page, event.rows);
    }

    onSearch(event: TableSearchEvent): void {
        this.creditStudyService.loadCreditStudies(1, 10, event.query);
    }

    onActionClick(event: TableActionEvent): void {
        console.log('event', event);
        switch (event.action) {
            case 'edit':
                this.router.navigate(['/estudio-credito/detalle-estudio', event.row.id]);
                break;
            case 'delete':
                console.log('Eliminar estudio de crédito:', event.row);
                break;
        }
    }

    onAdd(): void {
        this.router.navigate(['/estudio-credito/detalle-estudio']);
    }
}
