import { Component, input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
    selector: 'app-phone-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputGroupModule, InputGroupAddonModule, FloatLabelModule],
    templateUrl: './phone-input.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PhoneInput),
            multi: true
        }
    ]
})
export class PhoneInput implements ControlValueAccessor {
    label = input<string>('Numero de telefono');
    placeholder = input<string>('3001234567');
    countryCode = input<string>('+57');
    inputId = input<string>('phone-number');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('over');
    styleClass = input<string>('');

    innerControl = new FormControl('', { nonNullable: true });

    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.innerControl.valueChanges.subscribe((value) => {
            this.onChange(value);
        });
    }

    writeValue(value: string): void {
        this.innerControl.setValue(value ?? '', { emitEvent: false });
    }

    registerOnChange(fn: (value: string) => void): void {
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
