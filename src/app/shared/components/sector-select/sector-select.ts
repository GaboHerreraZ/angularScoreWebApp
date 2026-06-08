import { Component, inject, forwardRef, input, resource, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ParameterService } from '@/app/core/services/parameter.service';
import { Parameter } from '@/app/types/parameter';

/** Parameter augmented with a `codeLabel` display field, e.g. "4321 - Comercio". */
type SectorOption = Parameter & { codeLabel: string };

@Component({
    selector: 'app-sector-select',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AutoCompleteModule, FloatLabelModule],
    templateUrl: './sector-select.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SectorSelect),
            multi: true
        }
    ]
})
export class SectorSelect implements ControlValueAccessor {
    private parameterService = inject(ParameterService);

    label = input<string>('Sector');
    inputId = input<string>('sector-select');
    invalid = input<boolean>(false);
    variant = input<'on' | 'over' | 'in'>('over');
    styleClass = input<string>('w-full');

    innerControl = new FormControl<SectorOption | null>(null);
    filtered = signal<SectorOption[]>([]);

    sectorsResource = resource<SectorOption[], {}>({
        params: () => ({}),
        loader: () => firstValueFrom(this.parameterService.getByType('sector')).then(
            sectors => sectors.map(s => this.toOption(s))
        )
    });

    /** Id of a value written before the sectors list finished loading; resolved to a full option once available. */
    private pendingId = signal<number | null>(null);

    private onChange: (value: Parameter | null) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        this.innerControl.valueChanges.subscribe((value) => {
            this.onChange(value);
        });

        // Resolve a value written by id (or before load) once the sectors list is available.
        effect(() => {
            const id = this.pendingId();
            const all = this.sectorsResource.value();
            if (id == null || !all?.length) return;
            const match = all.find(s => s.id === id) ?? null;
            if (match) {
                this.innerControl.setValue(match, { emitEvent: false });
                this.pendingId.set(null);
            }
        });
    }

    /** Augments a Parameter with a `codeLabel` field, e.g. "4321 - Comercio", used as the autocomplete optionLabel. */
    private toOption(sector: Parameter): SectorOption {
        return { ...sector, codeLabel: `${sector.code} - ${sector.label}` };
    }

    onSearch(event: AutoCompleteCompleteEvent): void {
        const query = (event.query ?? '').toLowerCase().trim();
        const all = this.sectorsResource.value() ?? [];

        if (!query) {
            this.filtered.set(all);
            return;
        }
        this.filtered.set(all.filter(s => s.codeLabel.toLowerCase().includes(query)));
    }

    writeValue(value: Parameter | { id: number } | null): void {
        if (value == null) {
            this.pendingId.set(null);
            this.innerControl.setValue(null, { emitEvent: false });
            return;
        }
        // A full Parameter can be displayed immediately (normalized to render "code - label" on edit-load).
        // A partial value (just { id }) is deferred until the sectors list resolves the full option.
        if ('label' in value && 'code' in value) {
            this.innerControl.setValue(this.toOption(value as Parameter), { emitEvent: false });
        } else {
            this.pendingId.set(value.id);
        }
    }

    registerOnChange(fn: (value: Parameter | null) => void): void {
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
