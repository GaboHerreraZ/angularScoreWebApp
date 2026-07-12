import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { DimensionMeta } from '@/app/types/scoring-configuration';

/**
 * Tarjeta de una dimensión de scoring: ícono + nombre, el porcentaje destacado
 * (editable con slider + input al editar, o solo lectura), y la descripción de qué
 * mide. El peso es un `model` para enlace bidireccional: `[(weight)]`.
 */
@Component({
    selector: 'app-dimension-card',
    standalone: true,
    imports: [FormsModule, SliderModule, InputNumberModule],
    templateUrl: './dimension-card.html'
})
export class DimensionCard {
    /** Metadatos de la dimensión (label, ícono, descripción, nota). */
    dimension = input.required<DimensionMeta>();

    /** Peso actual de la dimensión (0–100). Bidireccional con el contenedor. */
    weight = model.required<number>();

    /** Modo edición: habilita el input y el slider. */
    editing = input<boolean>(false);

    /** Peso mínimo permitido; por debajo se marca la tarjeta como inválida. */
    minWeight = input<number>(0);

    /** True cuando el peso está por debajo del mínimo (solo relevante al editar). */
    belowMin = computed<boolean>(() => this.weight() < this.minWeight());
}
