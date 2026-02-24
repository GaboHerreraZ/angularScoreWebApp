import { Component, input, output, signal, effect, inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { AutoCompleteService, AutoCompleteOption } from './auto-complete.service';

@Component({
  selector: 'app-auto-complete',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  templateUrl: './auto-complete.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutoCompleteComponent),
      multi: true
    }
  ]
})
export class AutoCompleteComponent implements ControlValueAccessor {
  private readonly autoCompleteService = inject(AutoCompleteService);

  // Inputs
  endpointKey = input.required<string>();
  urlParams = input<Record<string, string | number>>();
  placeholder = input<string>('Buscar...');
  disabled = input<boolean>(false);
  forceSelection = input<boolean>(true);
  dropdown = input<boolean>(true);
  minLength = input<number>(1);
  delay = input<number>(300);
  showEmptyMessage = input<boolean>(true);
  emptyMessage = input<string>('No se encontraron resultados');
  styleClass = input<string>('w-full');
  inputStyleClass = input<string>('w-full');
  panelStyleClass = input<string>('');

  // Outputs
  valueChange = output<AutoCompleteOption | null>();

  // State
  suggestions = signal<AutoCompleteOption[]>([]);
  loading = signal<boolean>(false);
  selectedValue: AutoCompleteOption | null = null;

  // ControlValueAccessor
  private onChange: (value: AutoCompleteOption | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Efecto para validar que los parámetros requeridos estén presentes
    effect(() => {
      const key = this.endpointKey();
      const params = this.urlParams();

      if (key && params) {
        // Validación opcional: verificar que los parámetros necesarios estén presentes
        // Esto es útil durante el desarrollo
      }
    });
  }

  onSearch(event: AutoCompleteCompleteEvent): void {
    const query = event.query.trim();

    if (!query || query.length < this.minLength()) {
      this.suggestions.set([]);
      return;
    }

    this.loading.set(true);

    this.autoCompleteService
      .search(this.endpointKey(), query, this.urlParams())
      .subscribe({
        next: (results) => {
          this.suggestions.set(results);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al buscar en autocomplete:', error);
          this.suggestions.set([]);
          this.loading.set(false);
        }
      });
  }

  onValueChange(value: AutoCompleteOption | null): void {
    this.onChange(value);
    this.onTouched();
    this.valueChange.emit(value);
  }

  // ControlValueAccessor implementation
  writeValue(value: AutoCompleteOption | null): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: (value: AutoCompleteOption | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // El estado disabled ya se maneja a través del input signal
  }
}
