import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TableActionEvent } from '@/app/types/table';
import { CustomerCreditStudyResponse } from '@/app/types/credit-study';
import { CustomersService } from '../../customers.service';

@Component({
    selector: 'app-customer-credit-studies',
    standalone: true,
    imports: [CommonModule, CustomTable],
    templateUrl: './customer-credit-studies.html'
})
export class CustomerCreditStudies implements OnInit {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private customersService = inject(CustomersService);

    customerId = toSignal(
        this.route.parent!.params.pipe(map(params => params['id']))
    );

    creditStudies = signal<CustomerCreditStudyResponse[]>([]);
    loading = signal(false);

    tableSettings: TableSettings = {
        title: 'Estudios de Crédito del Cliente',
        titleIcon: 'pi pi-chart-line',
        dataKey: 'id',
        emptyMessage: 'No se encontraron estudios de crédito para este cliente.',
        addButton: {
            label: 'Agregar Estudio',
            icon: 'pi pi-plus',
            severity: 'success'
        },
        actions: [
            { id: 'view', icon: 'pi pi-eye', severity: 'info', tooltip: 'Ver detalle' }
        ],
        actionsHeader: 'Acciones',
        columns: [
            {
                header: 'Fecha del Estudio',
                field: 'studyDate',
                type: 'date',
                minWidth: '10rem'
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
                header: 'Estado',
                field: 'status.label',
                type: 'status',
                minWidth: '8rem',
                severityMap: {
                    'Estudio Realizado': 'success',
                    'Aprobado': 'success',
                    'En Revisión': 'info',
                    'Rechazado': 'danger'
                },
                defaultSeverity: 'info'
            }
        ]
    };

    ngOnInit(): void {
        this.loadCreditStudies();
    }

    loadCreditStudies(): void {
        const id = this.customerId();
        if (!id) return;

        this.loading.set(true);
        this.customersService.getCustomerCreditStudies(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(response => {
            this.creditStudies.set(response);
        });
    }

    onAddClick(): void {
        const id = this.customerId();
        if (!id) return;

        this.customersService.getCustomerById(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(customer => {
            this.router.navigate(['/estudio-credito/detalle-estudio'], {
                queryParams: {
                    customerId: id,
                    customerName: customer?.businessName ?? ''
                }
            });
        });
    }

    onActionClick(event: TableActionEvent): void {
        if (event.action === 'view') {
            this.router.navigate(['/estudio-credito/detalle-estudio', event.row.id]);
        }
    }
}
