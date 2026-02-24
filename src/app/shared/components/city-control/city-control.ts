import { Component, inject, forwardRef, input, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

interface CityOption {
    id: number;
    name: string;
}

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
    private http = inject(HttpClient);

    departmentId = input<number | null>(null);
    label = input<string>('Ciudad');
    inputId = input<string>('city-control');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('on');

    innerControl = new FormControl<CityOption | null>(null);

    citiesResource = resource<CityOption[], { departmentId: number | null }>({
        params: () => ({ departmentId: this.departmentId() }),
        loader: ({ params }) => {
            if (!params.departmentId) return Promise.resolve([]);
            return firstValueFrom(
                this.http.get<{ id: number; name: string }[]>(`https://api-colombia.com/api/v1/Department/${params.departmentId}/cities`).pipe(
                    map(cities => cities.map(c => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name)))
                )
            );
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
