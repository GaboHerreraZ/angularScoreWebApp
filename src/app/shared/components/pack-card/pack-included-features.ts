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
        <div class="relative px-2 py-6">
            <!-- Brillo decorativo de fondo -->
            <div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-md h-48 rounded-full bg-primary/10 blur-3xl"></div>

            <div class="relative">
                <!-- Encabezado -->
                <div class="flex items-center justify-center gap-4 mb-8">
                    <span class="hidden sm:block h-px w-16 bg-linear-to-r from-transparent to-primary/40"></span>
                    <span class="text-sm font-bold uppercase tracking-widest text-primary whitespace-nowrap">Cada análisis incluye</span>
                    <span class="hidden sm:block h-px w-16 bg-linear-to-l from-transparent to-primary/40"></span>
                </div>

                <!-- Capacidades -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8">
                    @for (feature of features(); track feature.label) {
                        <div class="feature group flex flex-col items-center text-center gap-4">
                            <!-- Alto fijo aunque el icono no lleve recuadro: mantiene alineadas
                                 las etiquetas entre columnas y fija el centro del halo. -->
                            <div class="glyph h-16 flex items-center justify-center text-primary">
                                <i class="pi {{ feature.icon }}"></i>
                            </div>
                            <span class="text-m font-medium text-color leading-snug max-w-40">{{ feature.label }}</span>
                        </div>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .feature {
                position: relative;
            }

            /*
              El tamano del icono se fija aca y no con una utilidad text-*.
              primeicons.css se importa fuera de capas y define .pi { font-size },
              y en la cascada lo no-capado le gana a @layer utilities: cualquier
              text-* sobre un .pi se ignora. Este selector (.glyph i) tiene mas
              especificidad que .pi, asi que si manda.
            */
            .glyph i {
                font-size: 2.5rem;
                line-height: 1;
            }

            /* El contenido va por encima del halo. */
            .feature > * {
                position: relative;
                z-index: 1;
            }

            /*
              Halo verde que florece detras del icono al pasar el mouse.
              Se centra a 2rem del tope de la columna: la mitad de la caja del
              glifo (h-16 = 4rem). Arranca encogido y escala junto con la
              opacidad, para que se lea como luz que se enciende y no como un
              circulo que aparece de golpe.

              La mezcla es baja a proposito (30%) y el desenfoque alto: con un
              icono suelto, sin recuadro que lo contenga, un halo saturado se
              lee como una mancha detras del glifo en vez de como iluminacion.
            */
            .feature::before {
                content: '';
                position: absolute;
                top: 2rem;
                left: 50%;
                width: 8rem;
                height: 8rem;
                z-index: 0;
                border-radius: 9999px;
                pointer-events: none;
                background: radial-gradient(circle closest-side, color-mix(in srgb, var(--p-primary-500) 30%, transparent), transparent 100%);
                filter: blur(12px);
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.7);
                transition:
                    opacity 380ms ease,
                    transform 380ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            .feature:hover::before {
                opacity: 0.55;
                transform: translate(-50%, -50%) scale(1);
            }

            /*
              Resplandor tenue pegado al contorno del glifo. Es drop-shadow y no
              color: el icono conserva su verde, solo proyecta algo de luz.
            */
            .glyph {
                transition: filter 380ms ease;
            }

            .feature:hover .glyph {
                filter: drop-shadow(0 0 7px color-mix(in srgb, var(--p-primary-500) 30%, transparent));
            }

            @media (prefers-reduced-motion: reduce) {
                .feature::before,
                .feature:hover::before {
                    transition: none;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `
    ]
})
export class PackIncludedFeatures {
    /** Capacidades incluidas en cada análisis. */
    features = input<IncludedFeature[]>([
        { icon: 'pi-shield', label: 'Consulta en Datacrédito Experian' },
        { icon: 'pi-verified', label: 'Verificación en listas restrictivas (SARLAFT)' },
        { icon: 'pi-file-pdf', label: 'Lectura de estados financieros en PDF' },
        { icon: 'pi-sparkles', label: 'Score y análisis de riesgo con IA' },
        { icon: 'pi-file-export', label: 'Reporte del estudio en PDF' },
        { icon: 'pi-pen-to-square', label: 'Pagaré con firma electrónica' }
    ]);
}
