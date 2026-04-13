import { Component, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
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
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { ParameterService } from '@/app/core/services/parameter.service';
import { Parameter } from '@/app/types/parameter';
import { Customer } from '@/app/types/customer';
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
        PhoneInput,
        StateControl,
        CityControl
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

    // Read :id from the own route (standalone create) or from the parent route (edit inside tab wrapper)
    customerId = toSignal(
        merge(
            this.route.params.pipe(map(p => p['id'])),
            this.route.parent ? this.route.parent.params.pipe(map(p => p['id'])) : of(undefined)
        ).pipe(
            filter(id => id !== undefined),
            distinctUntilChanged()
        )
    );

    stateControl = viewChild<StateControl>('stateControl');
    cityControl = viewChild<CityControl>('cityControl');

    loading = signal(false);
    isJuridica = signal(false);
    selectedDepartmentId = signal<number | null>(null);

    // Pending data to match when loading a customer in edit mode
    private pendingStateName: string | null = null;
    private pendingCityName: string | null = null;

    personTypes = toSignal(this.parameterService.getByType('personType'));

    sectorTypes = toSignal(this.parameterService.getByType('sector'));

    identificationTypes = toSignal(this.parameterService.getByType('identification_type'));

    form = new FormGroup({
        personTypeId: new FormControl({}, { validators: [Validators.required] }),
        identificationTypeId: new FormControl({}, { validators: [Validators.required] }),
        businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        identificationNumber: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        legalRepName: new FormControl('', { nonNullable: true }),
        legalRepId: new FormControl('', { nonNullable: true }),
        legalRepIdentificationTypeId: new FormControl<Parameter | null>(null),
        legalRepEmail: new FormControl('', { nonNullable: true }),
        legalRepPhone: new FormControl('', { nonNullable: true }),
        economicActivityId: new FormControl({}, { nonNullable: true, validators:[Validators.required] }),
        seniority: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
        email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        phone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        secondaryPhone: new FormControl('', { nonNullable: true }),
        state: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
        city: new FormControl<{ id: number; name: string } | null>(null, { validators: [Validators.required] }),
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
        // Effect to load data when customerId changes
        effect(() => {
            const id = this.customerId();
            if (id) {
                this.loadCustomer(id);
            }
        });

        // Toggle legal rep validators based on person type
        this.form.controls.personTypeId.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(value => {
            const code = (value as any as Parameter)?.code;
            const isJuridica = code === 'personaJuridica';
            this.isJuridica.set(isJuridica);
            const legalRepControls = [
                this.form.controls.legalRepName,
                this.form.controls.legalRepId,
                this.form.controls.legalRepIdentificationTypeId,
                this.form.controls.legalRepEmail,
                this.form.controls.legalRepPhone
            ];
            for (const control of legalRepControls) {
                if (isJuridica) {
                    control.setValidators(control === this.form.controls.legalRepEmail
                        ? [Validators.required, Validators.email]
                        : [Validators.required]);
                } else {
                    control.clearValidators();
                }
                control.updateValueAndValidity();
            }
        });

        // When the department changes, reset the city
        this.form.controls.state.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(state => {
            this.selectedDepartmentId.set(state?.id ?? null);
            this.form.controls.city.reset();
        });

        // Pending department match by name once the resource finishes loading
        effect(() => {
            const ctrl = this.stateControl();
            const departments = ctrl?.departmentsResource.value();
            if (this.pendingStateName && departments?.length) {
                const match = departments.find(d => d.name === this.pendingStateName);
                if (match) {
                    this.form.controls.state.setValue(match, { emitEvent: true });
                    this.pendingStateName = null;
                }
            }
        });

        // Pending city match by name once the resource finishes loading
        effect(() => {
            const ctrl = this.cityControl();
            const cities = ctrl?.citiesResource.value();
            if (this.pendingCityName && cities?.length) {
                const match = cities.find(c => c.name === this.pendingCityName);
                if (match) {
                    this.form.controls.city.setValue(match, { emitEvent: false });
                    this.pendingCityName = null;
                }
            }
        });
    }

    loadCustomer(id: number): void {
        this.loading.set(true);
        this.customersService.getCustomerById(id).pipe(
            finalize(() => this.loading.set(false)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((customer) => {
            if (customer) {
                // Find the matching objects in the option arrays
                const personType = this.personTypes()?.find(p => p.id === customer.personTypeId);
                const identificationType = this.identificationTypes()?.find(i => i.id === customer.identificationTypeId);
                const economicActivity = this.sectorTypes()?.find(s => s.id === customer.economicActivityId);

                // Store names to match once the resources finish loading
                this.pendingStateName = customer.state ?? null;
                this.pendingCityName = customer.city ?? null;

                this.form.patchValue({
                    personTypeId: personType,
                    identificationTypeId: identificationType,
                    businessName: customer.businessName,
                    identificationNumber: customer.identificationNumber,
                    legalRepName: customer.legalRepName ?? '',
                    legalRepId: customer.legalRepId ?? '',
                    legalRepIdentificationTypeId: this.identificationTypes()?.find(i => i.id === customer.legalRepIdentificationTypeId) ?? null,
                    legalRepEmail: customer.legalRepEmail ?? '',
                    legalRepPhone: customer.legalRepPhone ?? '',
                    economicActivityId: economicActivity,
                    seniority: customer.seniority ?? 0,
                    email: customer.email ?? '',
                    phone: customer.phone ?? '',
                    secondaryPhone: customer.secondaryPhone ?? '',
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
            identificationTypeId: (formData.identificationTypeId as any as Parameter).id,
            economicActivityId: (formData.economicActivityId as any as Parameter).id,
            legalRepIdentificationTypeId: (formData.legalRepIdentificationTypeId as any as Parameter)?.id ?? undefined,
            state: formData.state?.name ?? undefined,
            city: formData.city?.name ?? undefined
        } as unknown as Customer;

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

                // On create, navigate to edit mode with the new ID
                if (!this.customerId() && result.data?.id) {
                    this.router.navigate(['/app/clientes/detalle-cliente', result.data.id]);
                }
                // On edit, reload the updated data
                else if (this.customerId()) {
                    this.loadCustomer(this.customerId()!);
                }
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/app/clientes']);
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
