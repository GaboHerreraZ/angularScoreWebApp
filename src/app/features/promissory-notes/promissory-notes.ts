import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableColumn, TableSettings, TablePageChangeEvent, TableActionEvent } from '@/app/types/table';
import { PromissoryNotesService } from './promissory-notes.service';

@Component({
    selector: 'app-promissory-notes',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './promissory-notes.html'
})
export class PromissoryNotes implements OnInit {
    private destroyRef = inject(DestroyRef);
    private router = inject(Router);

    tableSettings: TableSettings = {
        title: 'Gestión de Pagarés',
        titleIcon: 'pi pi-file-edit',
        subtitle: 'Consulta los pagarés generados y su estado de firma y vencimiento.',
        headerVariant: 'page',
        dataKey: 'id',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        // El endpoint de listado no soporta búsqueda por texto; solo paginación.
        showSearch: false,
        showColumnFilters: false,
        emptyMessage: 'No se encontraron pagarés.',
        emptyState: {
            icon: 'pi pi-file-edit',
            title: 'Aún no tienes pagarés',
            description: 'Los pagarés se generan desde el detalle de un estudio de crédito viable.'
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
                header: 'N.º Pagaré',
                field: 'noteNumber',
                type: 'number',
                minWidth: '8rem'
            },
            {
                header: 'Monto',
                field: 'amount',
                type: 'currency',
                currencyCode: 'COP',
                minWidth: '12rem'
            },
            {
                header: 'Plazo (días)',
                field: 'termDays',
                type: 'number',
                minWidth: '8rem'
            },
            {
                header: 'Fecha de Vencimiento',
                field: 'dueDate',
                type: 'date',
                minWidth: '10rem'
            },
            {
                header: 'Estado',
                field: 'status.label',
                type: 'status',
                minWidth: '10rem',
                severityMap: {
                    'Firmado': 'success',
                    'Enviado': 'info',
                    'Enviado a firma': 'info',
                    'Pendiente': 'warn',
                    'Pendiente de firma': 'warn',
                    'Rechazado': 'danger',
                    'Declinado': 'danger'
                },
                defaultSeverity: 'info'
            },
            {
                header: 'Fecha de Firma',
                field: 'signedAt',
                type: 'date',
                minWidth: '10rem'
            }
        ]
    };

    constructor(public promissoryNotesService: PromissoryNotesService) {}

    ngOnInit(): void {
        // Activa el pipe del servicio para que sus taps escriban en las señales de la vista.
        this.promissoryNotesService.promissoryNotes$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onPageChange(event: TablePageChangeEvent): void {
        this.promissoryNotesService.loadPromissoryNotes(event.page, event.rows);
    }

    onActionClick(event: TableActionEvent): void {
        if (event.action === 'view') {
            this.router.navigate(['/app/pagares/detalle-pagare', event.row.id]);
        }
    }
}
