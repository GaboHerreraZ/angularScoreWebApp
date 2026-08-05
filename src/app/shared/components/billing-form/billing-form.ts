import { Component, computed, DestroyRef, effect, inject, input, resource, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FluidModule } from 'primeng/fluid';
import { PhoneInput } from '@/app/shared/components/phone-input/phone-input';
import { StateControl } from '@/app/shared/components/state-control/state-control';
import { CityControl } from '@/app/shared/components/city-control/city-control';
import { ParameterService } from '@/app/core/services/parameter.service';
import { Parameter } from '@/app/types/parameter';
import { isBusinessDocType, syncBillingNameValidators } from './billing-form.builder';

@Component({
    selector: 'app-billing-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        InputTextModule,
        SelectModule,
        FloatLabelModule,
        FluidModule,
        PhoneInput,
        StateControl,
        CityControl
    ],
    templateUrl: './billing-form.html'
})
export class BillingForm {
    private destroyRef = inject(DestroyRef);
    private parameterService = inject(ParameterService);

    formGroup = input.required<FormGroup>();
    pendingStateName = input<string | null>(null);
    pendingCityName = input<string | null>(null);

    stateRef = viewChild<StateControl>('stateRef');
    cityRef = viewChild<CityControl>('cityRef');

    departmentId = signal<number | null>(null);
    private resolvedStateName = signal<string | null>(null);
    private resolvedCityName = signal<string | null>(null);

    /** True cuando el documento es NIT: se factura a una razón social, no a una persona. */
    isBusiness = signal(false);

    identificationTypesResource = resource<Parameter[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('identification_type'))
    });

    constructor() {
        // Alterna entre "Nombres/Apellidos" y "Razón social" segun el tipo de documento.
        effect((onCleanup) => {
            const docTypeCtrl = this.formGroup().get('billingDocType');
            if (!docTypeCtrl) return;

            let wasBusiness = isBusinessDocType(docTypeCtrl.value);
            this.isBusiness.set(wasBusiness);
            syncBillingNameValidators(this.formGroup(), false);

            const sub = docTypeCtrl.valueChanges
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((docType: Parameter | null) => {
                    const nowBusiness = isBusinessDocType(docType);
                    // Solo se limpia al cruzar entre persona y empresa. Pasar de
                    // cédula a pasaporte no debe borrar los nombres ya escritos.
                    const crossed = nowBusiness !== wasBusiness;
                    wasBusiness = nowBusiness;
                    this.isBusiness.set(nowBusiness);
                    syncBillingNameValidators(this.formGroup(), crossed);
                });

            onCleanup(() => sub.unsubscribe());
        });

        effect((onCleanup) => {
            const stateCtrl = this.formGroup().get('billingState');
            if (!stateCtrl) return;
            this.departmentId.set(stateCtrl.value?.id ?? null);
            const sub = stateCtrl.valueChanges.pipe(
                takeUntilDestroyed(this.destroyRef)
            ).subscribe((state: any) => {
                this.departmentId.set(state?.id ?? null);
                if (this.resolvedStateName()) {
                    this.formGroup().get('billingCity')?.reset();
                }
            });
            onCleanup(() => sub.unsubscribe());
        });

        // Resolve state by name once departments are loaded
        effect(() => {
            const ctrl = this.stateRef();
            const departments = ctrl?.departmentsResource.value();
            const pending = this.pendingStateName();
            if (pending && pending !== this.resolvedStateName() && departments?.length) {
                const match = departments.find(d => d.name === pending);
                if (match) {
                    this.formGroup().get('billingState')?.setValue(match, { emitEvent: true });
                    this.formGroup().markAsPristine();
                    this.resolvedStateName.set(pending);
                }
            }
        });

        // Resolve city by name once cities for the matched department are loaded
        effect(() => {
            const ctrl = this.cityRef();
            const cities = ctrl?.citiesResource.value();
            const pending = this.pendingCityName();
            if (pending && pending !== this.resolvedCityName() && cities?.length) {
                const match = cities.find(c => c.name === pending);
                if (match) {
                    this.formGroup().get('billingCity')?.setValue(match, { emitEvent: false });
                    this.formGroup().markAsPristine();
                    this.resolvedCityName.set(pending);
                }
            }
        });
    }

    isInvalid(controlName: string): boolean {
        const control = this.formGroup().get(controlName);
        return !!control && control.invalid && control.touched;
    }

    getErrorMessage(controlName: string): string {
        const control = this.formGroup().get(controlName);
        if (!control || !control.errors || !control.touched) return '';
        if (control.errors['required']) return 'Este campo es obligatorio';
        if (control.errors['email']) return 'Ingrese un email válido';
        return '';
    }
}
