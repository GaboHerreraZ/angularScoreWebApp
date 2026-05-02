import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TablePageChangeEvent, TableSearchEvent, TableActionEvent } from '@/app/types/table';
import { CustomersService } from './customers.service';
import { AuthService } from '@/app/core/services/auth.service';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './customers.html'
})
export class Customers implements OnInit {
    private destroyRef = inject(DestroyRef);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    exporting = signal(false);

    private canExportExcel = computed(() => this.authService.currentProfile()?.permissions?.canExportExcel ?? false);
    private canAddCustomer = computed(() => this.authService.currentProfile()?.permissions?.canAddCustomer ?? false);


    tableSettings = computed<TableSettings>(() => ({
        title: 'Gestión de Clientes',
        dataKey: 'id',
        rows: 10,
        rowsPerPageOptions: [10, 25, 50],
        searchPlaceholder: 'Buscar clientes...',
        emptyMessage: 'No se encontraron clientes.',
        ...(this.canAddCustomer() ? {
            addButton: {
                label: 'Nuevo Cliente',
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
    }));

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
                this.router.navigate(['/app/clientes/detalle-cliente', event.row.id]);
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
        this.router.navigate(['/app/clientes/detalle-cliente']);
    }

    onExport(): void {
        this.exporting.set(true);
        this.customersService.exportToExcel().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (response) => {
                const blob = response.body;
                if (!blob) {
                    this.exporting.set(false);
                    return;
                }

                const fileName = this.extractFileName(response.headers.get('Content-Disposition'))
                    ?? `clientes-${new Date().toISOString().slice(0, 10)}.xlsx`;

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
                this.exporting.set(false);
            },
            error: () => {
                this.notificationService.error('No se pudo exportar los clientes. Intenta de nuevo.', 'Error');
                this.exporting.set(false);
            }
        });
    }

    private extractFileName(contentDisposition: string | null): string | null {
        if (!contentDisposition) return null;
        const match = /filename="?([^"]+)"?/.exec(contentDisposition);
        return match?.[1] ?? null;
    }
}
