import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { CustomTable } from '@/app/shared/components/table/table';
import { TableSettings, TableActionEvent } from '@/app/types/table';
import { CustomerCreditStudyResponse } from '@/app/types/credit-study';
import { StudyTypeSelector } from '@/app/features/credit-study/payment-capacity/study-type-selector/study-type-selector';
import { StudyTypeCode } from '@/app/types/payment-capacity';
import { CustomersService } from '../../customers.service';

@Component({
    selector: 'app-customer-credit-studies',
    standalone: true,
    imports: [CommonModule, CustomTable, StudyTypeSelector],
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
    studyTypeSelectorVisible = signal(false);
    private personTypeCode = signal<string | null>(null);

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
                header: 'Tipo',
                field: 'studyType.label',
                type: 'status',
                minWidth: '11rem',
                severityMap: {
                    'Estudio empresarial': 'info',
                    'Estudio de capacidad de pago': 'success'
                },
                defaultSeverity: 'secondary'
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
        this.loadPersonType();
    }

    /** El tipo de persona decide si hay elección de estudio (capacidad es solo PN). */
    private loadPersonType(): void {
        const id = this.customerId();
        if (!id) return;
        this.customersService.getCustomerById(id).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(customer => this.personTypeCode.set(customer.personType?.code ?? null));
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
        if (!this.customerId()) return;
        if (this.personTypeCode() === 'naturalPerson') {
            this.studyTypeSelectorVisible.set(true);
            return;
        }
        // PJ (o tipo aún no cargado): solo aplica el empresarial, sin diálogo.
        this.navigateToCreate('financialStatements');
    }

    onStudyTypeSelected(studyType: StudyTypeCode): void {
        this.navigateToCreate(studyType);
    }

    /** El formulario de creación carga el cliente por customerId y precarga el step 1. */
    private navigateToCreate(studyType: StudyTypeCode): void {
        const path = studyType === 'paymentCapacity' ? 'estudio-capacidad' : 'detalle-estudio';
        this.router.navigate([`/app/estudio-credito/${path}`], {
            queryParams: { customerId: this.customerId() }
        });
    }

    onActionClick(event: TableActionEvent): void {
        if (event.action === 'view') {
            // Cada tipo de estudio tiene su propio detalle.
            const path = event.row['studyType']?.code === 'paymentCapacity'
                ? 'estudio-capacidad'
                : 'detalle-estudio';
            this.router.navigate([`/app/estudio-credito/${path}`, event.row.id]);
        }
    }
}
