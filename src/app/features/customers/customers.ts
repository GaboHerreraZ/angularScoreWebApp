import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TablePageChangeEvent, TableSearchEvent, TableActionEvent } from '@/app/types/table';
import { CustomersService } from './customers.service';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './customers.html'
})
export class Customers implements OnInit {
    private destroyRef = inject(DestroyRef);

    tableSettings: TableSettings = {
        title: 'Gestión de Clientes',
        dataKey: 'id',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        searchPlaceholder: 'Buscar clientes...',
        emptyMessage: 'No se encontraron clientes.',
        addButton: {
            label: 'Agregar Cliente',
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
                header: 'Razón Social',
                field: 'businessName',
                type: 'text',
                minWidth: '14rem'
            },
            {
                header: 'Identificación',
                field: 'identificationNumber',
                type: 'text',
                minWidth: '10rem'
            },
            {
                header: 'Teléfono',
                field: 'phone',
                type: 'text',
                minWidth: '10rem'
            },
            {
                header: 'Email',
                field: 'email',
                type: 'text',
                minWidth: '12rem'
            },
            {
                header: 'Ciudad',
                field: 'city',
                type: 'text',
                minWidth: '10rem'
            }
        ]
    };

    constructor(
        public customersService: CustomersService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.customersService.customers$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    onPageChange(event: TablePageChangeEvent): void {
        this.customersService.loadCustomers(event.page, event.rows);
    }

    onSearch(event: TableSearchEvent): void {
        this.customersService.loadCustomers(1, 10, event.query);
    }

    onActionClick(event: TableActionEvent): void {
        switch (event.action) {
            case 'edit':
                this.router.navigate(['/clientes/detalle-cliente', event.row.id]);
                break;
            case 'delete':
                this.customersService.deleteCustomer(event.row.id).pipe(
                    takeUntilDestroyed(this.destroyRef)
                ).subscribe((result) => {
                    if (result.success) {
                        this.customersService.loadCustomers();
                    } else {
                        console.error(result.error);
                    }
                });
                break;
        }
    }

    onAdd(): void {
        this.router.navigate(['/clientes/detalle-cliente']);
    }
}
