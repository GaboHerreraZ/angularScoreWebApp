import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, merge, of } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { CustomersService } from '../customers.service';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { ParameterService } from '@/app/core/services/parameter.service';
import { Parameter } from '@/app/types/parameter';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        FloatLabelModule,
        FluidModule,
        MessageModule,
        SkeletonModule,
        PhoneInput
    ],
    templateUrl: './customer-detail.html'
})
export class CustomerDetail {
    private destroyRef = inject(DestroyRef);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private customersService = inject(CustomersService);
    private parameterService = inject(ParameterService);

    private notificationService = inject(NotificationService);

    // Leer :id de la ruta propia (create standalone) o de la ruta padre (edit dentro del tab wrapper)
    customerId = toSignal(
        merge(
            this.route.params.pipe(map(p => p['id'])),
            this.route.parent ? this.route.parent.params.pipe(map(p => p['id'])) : of(undefined)
        ).pipe(
            filter(id => id !== undefined),
            distinctUntilChanged()
        )
    );

    loading = signal(false);

    personTypes = toSignal(this.parameterService.getByType('personType'));

    sectorTypes = toSignal(this.parameterService.getByType('sector'));

    form = new FormGroup({
        personTypeId: new FormControl({}, { validators: [Validators.required] }),
        businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        legalRepName: new FormControl('', { nonNullable: true }),
        legalRepId: new FormControl('', { nonNullable: true }),
        economicActivityId: new FormControl({}, { nonNullable: true, validators:[Validators.required] }),
        seniority: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        secondaryPhone: new FormControl('', { nonNullable: true }),
        city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        commercialRef1Name: new FormControl('', { nonNullable: true }),
        commercialRef1Contact: new FormControl('', { nonNullable: true }),
        commercialRef1Phone: new FormControl('', { nonNullable: true }),
        commercialRef2Name: new FormControl('', { nonNullable: true }),
        commercialRef2Contact: new FormControl('', { nonNullable: true }),
        commercialRef2Phone: new FormControl('', { nonNullable: true }),
        observations: new FormControl('', { nonNullable: true })
    });

    constructor() {
        // Effect para cargar datos cuando cambia el customerId
        effect(() => {
            const id = this.customerId();
            console.log('id', id);
            if (id) {
                this.loadCustomer(id);
            }
        });
    }

    loadCustomer(id: number): void {
        this.loading.set(true);
        this.customersService.getCustomerById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((customer) => {
            console.log('customer', customer);
            if (customer) {
                // Buscar los objetos correspondientes en los arrays de opciones
                const personType = this.personTypes()?.find(p => p.id === customer.personTypeId);
                const economicActivity = this.sectorTypes()?.find(s => s.id === customer.economicActivityId);

                this.form.patchValue({
                    personTypeId: personType,
                    businessName: customer.businessName,
                    identificationNumber: customer.identificationNumber,
                    legalRepName: customer.legalRepName ?? '',
                    legalRepId: customer.legalRepId ?? '',
                    economicActivityId: economicActivity,
                    seniority: customer.seniority ?? 0,
                    email: customer.email ?? '',
                    phone: customer.phone ?? '',
                    secondaryPhone: customer.secondaryPhone ?? '',
                    city: customer.city ?? '',
                    address: customer.address ?? '',
                    commercialRef1Name: customer.commercialRef1Name ?? '',
                    commercialRef1Contact: customer.commercialRef1Contact ?? '',
                    commercialRef1Phone: customer.commercialRef1Phone ?? '',
                    commercialRef2Name: customer.commercialRef2Name ?? '',
                    commercialRef2Contact: customer.commercialRef2Contact ?? '',
                    commercialRef2Phone: customer.commercialRef2Phone ?? '',
                    observations: customer.observations ?? ''
                });
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        const formData = this.form.getRawValue();

        const customerData = {
            ...formData,
            personTypeId: (formData.personTypeId as any as Parameter).id,
            economicActivityId: (formData.economicActivityId as any as Parameter).id
        };

        const operation$ = this.customerId()
            ? this.customersService.updateCustomer(this.customerId()!, customerData)
            : this.customersService.createCustomer(customerData);

        operation$.pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((result:any) => {
            if (result.success) {
                const message = this.customerId() ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente';
                this.notificationService.success(message, 'OK');

                // Si es creación, navegar al modo edición con el nuevo ID
                if (!this.customerId() && result.data?.id) {
                    this.router.navigate(['/clientes/detalle-cliente', result.data.id]);
                }
                // Si es edición, recargar los datos actualizados
                else if (this.customerId()) {
                    this.loadCustomer(this.customerId()!);
                }
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/clientes']);
    }

    isInvalid(controlName: string): boolean {
        const control = this.form.get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        if (control.errors['min']) return 'El valor debe ser mayor o igual a 0';
        return '';
    }
}
