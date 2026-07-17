import { Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Tarjeta de una dimensión de scoring: ícono + nombre + interruptor de habilitación,
 * el porcentaje destacado (editable con slider + input al editar, o solo lectura), y la
 * descripción de qué mide. El peso es un `model` (`[(weight)]`); habilitar/quitar se
 * emite por `enabledChange`. Las obligatorias no se pueden apagar.
 */
@Component({
    selector: 'app-dimension-card',
    standalone: true,
    imports: [FormsModule, SliderModule, InputNumberModule, ToggleSwitchModule, TooltipModule],
    templateUrl: './dimension-card.html'
})
export class DimensionCard {
    /** Nombre de la dimensión. */
    label = input.required<string>();

    /** Descripción de qué mide (viene del catálogo del backend). */
    description = input.required<string>();

    /** Ícono (mapa local por code). */
    icon = input.required<string>();

    /** Dimensión obligatoria: siempre habilitada, el interruptor queda bloqueado. */
    required = input<boolean>(false);

    /** Si la dimensión está habilitada (cuenta para el score). Bidireccional con el contenedor. */
    enabled = model.required<boolean>();

    /** Peso actual de la dimensión (0–100). Bidireccional con el contenedor. */
    weight = model.required<number>();

    /** Modo edición: habilita el input, el slider y el interruptor. */
    editing = input<boolean>(false);

    /** Peso mínimo permitido; por debajo se marca la tarjeta como inválida. */
    minWeight = input<number>(0);

    /** El interruptor es interactivo solo al editar y si no es obligatoria. */
    canToggle = computed<boolean>(() => this.editing() && !this.required());

    /** True cuando la habilitada está por debajo del mínimo (solo relevante al editar). */
    belowMin = computed<boolean>(() => this.enabled() && this.weight() < this.minWeight());

    /** Atenúa la tarjeta cuando está deshabilitada. */
    dimmed = computed<boolean>(() => !this.enabled());
}
