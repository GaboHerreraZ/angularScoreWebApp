import { Component, input } from '@angular/core';

/** Capacidad incluida en cada análisis: icono distintivo + etiqueta. */
export interface IncludedFeature {
    icon: string;
    label: string;
}

/**
 * Franja con las capacidades incluidas en cada análisis de crédito.
 * Se muestra una sola vez junto a la grilla de packs (landing y administración)
 * en lugar de repetir la checklist dentro de cada {@link PackDisplayCard}, ya que
 * todos los packs incluyen exactamente lo mismo.
 *
 * @example
 * ```html
 * <app-pack-included-features class="block mt-8" />
 * ```
 */
@Component({
    selector: 'app-pack-included-features',
    standalone: true,
    template: `
        <div class="relative overflow-hidden rounded-2xl border border-surface bg-surface-50 dark:bg-surface-900 px-6 py-8 sm:px-10">
            <!-- Brillo decorativo -->
            <div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-md h-48 rounded-full bg-primary/10 blur-3xl"></div>

            <div class="relative">
                <!-- Encabezado -->
                <div class="flex items-center justify-center gap-4 mb-8">
                    <span class="hidden sm:block h-px w-16 bg-linear-to-r from-transparent to-primary/40"></span>
                    <span class="text-sm font-bold uppercase tracking-widest text-primary whitespace-nowrap">Cada análisis incluye</span>
                    <span class="hidden sm:block h-px w-16 bg-linear-to-l from-transparent to-primary/40"></span>
                </div>

                <!-- Capacidades -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
                    @for (feature of features(); track feature.label) {
                        <div class="group flex flex-col items-center text-center gap-3">
                            <div
                                class="w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary flex items-center justify-center
                                       transition-all duration-200 group-hover:bg-primary group-hover:text-primary-contrast group-hover:ring-primary group-hover:scale-110"
                            >
                                <i class="pi {{ feature.icon }} text-lg"></i>
                            </div>
                            <span class="text-m font-medium text-color leading-snug max-w-40">{{ feature.label }}</span>
                        </div>
                    }
                </div>
            </div>
        </div>
    `
})
export class PackIncludedFeatures {
    /** Capacidades incluidas en cada análisis. */
    features = input<IncludedFeature[]>([
        { icon: 'pi-shield', label: 'Consulta en Datacrédito Experian' },
        { icon: 'pi-file-pdf', label: 'Lectura de estados financieros en PDF' },
        { icon: 'pi-sparkles', label: 'Score y análisis de riesgo con IA' },
        { icon: 'pi-file-export', label: 'Reporte del estudio en PDF' },
        { icon: 'pi-pen-to-square', label: 'Pagaré con firma electrónica' }
    ]);
}
