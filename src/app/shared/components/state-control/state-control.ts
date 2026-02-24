import { Component, inject, forwardRef, input, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { SelectModule } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

interface DepartmentOption {
    id: number;
    name: string;
}

@Component({
    selector: 'app-state-control',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, SelectModule, FloatLabelModule],
    templateUrl: './state-control.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => StateControl),
            multi: true
        }
    ]
})
export class StateControl implements ControlValueAccessor {
    private http = inject(HttpClient);

    label = input<string>('Departamento');
    inputId = input<string>('state-control');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('on');

    innerControl = new FormControl<DepartmentOption | null>(null);

    departmentsResource = resource<DepartmentOption[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(
            this.http.get<{ id: number; name: string }[]>('https://api-colombia.com/api/v1/Department').pipe(
                map(departments => departments.map(d => ({ id: d.id, name: d.name })).sort((a, b) => a.name.localeCompare(b.name)))
            )
        )
    });

    private onChange: (value: DepartmentOption | null) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.innerControl.valueChanges.subscribe((value) => {
            this.onChange(value);
        });
    }

    writeValue(value: DepartmentOption | null): void {
        this.innerControl.setValue(value, { emitEvent: false });
    }

    registerOnChange(fn: (value: DepartmentOption | null) => void): void {
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
