import { Component, inject, forwardRef, input, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import { LocationsService, LocationOption } from '@/app/core/services/locations.service';

type CityOption = LocationOption;

@Component({
    selector: 'app-city-control',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SelectModule, FloatLabelModule],
    templateUrl: './city-control.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CityControl),
            multi: true
        }
    ]
})
export class CityControl implements ControlValueAccessor {
    private locations = inject(LocationsService);

    /** Código DANE del departamento (2 dígitos). Sin él no hay municipios. */
    regionCode = input<string | null>(null);
    label = input<string>('Ciudad');
    inputId = input<string>('city-control');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('on');

    innerControl = new FormControl<CityOption | null>(null);

    citiesResource = resource<CityOption[], { regionCode: string | null }>({
        params: () => ({ regionCode: this.regionCode() }),
        loader: ({ params }) => {
            if (!params.regionCode) return Promise.resolve([]);
            return firstValueFrom(this.locations.getCities(params.regionCode));
        }
    });

    private onChange: (value: CityOption | null) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.innerControl.valueChanges.subscribe((value) => {
            this.onChange(value);
        });
    }

    writeValue(value: CityOption | null): void {
        this.innerControl.setValue(value, { emitEvent: false });
    }

    registerOnChange(fn: (value: CityOption | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.innerControl.disable({ emitEvent: false });
        } else {
            this.innerControl.enable({ emitEvent: false });
        }
    }

    onBlur(): void {
        this.onTouched();
    }
}
