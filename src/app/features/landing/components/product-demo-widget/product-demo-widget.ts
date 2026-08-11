import { afterNextRender, Component, computed, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

interface DemoStep {
    icon: string;
    title: string;
    description: string;
}


@Component({
    standalone: true,
    selector: 'product-demo-widget',
    imports: [NgTemplateOutlet, RouterModule, ScrollAnimateDirective],
    templateUrl: './product-demo-widget.html',
    styles: [
        `
            .step-enter {
                animation: step-enter 650ms cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes step-enter {
                from {
                    opacity: 0;
                    transform: translateY(12px) scale(0.98);
                }
                to {
                    opacity: 1;
                    transform: none;
                }
            }

            .pdf-drop {
                animation: pdf-drop 1100ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
            }

            @keyframes pdf-drop {
                0% {
                    opacity: 0;
                    transform: translateY(-3.5rem) rotate(-8deg) scale(0.9);
                }
                55% {
                    opacity: 1;
                }
                75% {
                    transform: translateY(4px) rotate(1deg);
                }
                100% {
                    transform: translateY(0) rotate(0);
                }
            }

            .pdf-zone {
                animation: pdf-zone 1300ms ease-out backwards;
            }

            @keyframes pdf-zone {
                0%,
                65% {
                    border-color: color-mix(in srgb, var(--p-primary-500) 55%, transparent);
                    background: color-mix(in srgb, var(--p-primary-500) 6%, transparent);
                }
            }

            /* Aparición con "pop" del estado de éxito. */
            .pop-in {
                animation: pop-in 300ms ease-out backwards;
            }

            @keyframes pop-in {
                from {
                    opacity: 0;
                    transform: scale(0.6);
                }
            }

            /* Tarjetas flotantes alrededor del mockup. */
            .float-card {
                animation: float-card 6s ease-in-out infinite;
            }

            .float-card-alt {
                animation-delay: -3s;
            }

            @keyframes float-card {
                0%,
                100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-10px);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .step-enter,
                .float-card,
                .pdf-drop,
                .pdf-zone,
                .pop-in {
                    animation: none;
                }
            }
        `
    ]
})
export class ProductDemoWidget implements OnDestroy {
    /** Duración de cada paso del ciclo. */
    private static readonly STEP_MS = 4000;

    readonly steps: DemoStep[] = [
        { icon: 'pi-id-card', title: 'Identifica a tu cliente', description: 'Elige el tipo de documento e ingresa el número.' },
        { icon: 'pi-file-pdf', title: 'Sube los estados financieros', description: 'Un PDF basta. La IA lee las cifras.' },
        { icon: 'pi-shield', title: 'Cruzamos los datos', description: 'Datacrédito Experian + indicadores financieros con IA.' },
        { icon: 'pi-chart-bar', title: 'Recibe el score de riesgo', description: 'Un número claro para decidir.' },
        { icon: 'pi-pen-to-square', title: 'Cierra con pagaré digital', description: 'Se genera solo y queda listo para firma electrónica.' }
    ];

    demoRef = viewChild<ElementRef<HTMLElement>>('demo');

    /** Paso del ciclo que se está mostrando. */
    activeStep = signal(0);
    /** Avance del paso activo (0–1); llena el dot activo y anima los mockups. */
    progress = signal(0);

    /** Con movimiento reducido no hay auto-ciclo: se rinden los pasos apilados. */
    readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Paso 1: selección de documento + número tecleado ─────────────
    /** Número completo que se "teclea" en el mockup del paso 1. */
    private static readonly DOC_NUMBER = '900.123.456-7';

    /** True mientras el dropdown de tipo de documento está desplegado. */
    docDropdownOpen = computed(() =>
        !this.reduceMotion && this.activeStep() === 0 && this.progress() >= 0.08 && this.progress() < 0.32
    );

    /** True cuando la opción "NIT" se resalta, justo antes de elegirse. */
    docOptionActive = computed(() => this.activeStep() === 0 && this.progress() >= 0.18);

    /** True cuando el tipo de documento ya quedó elegido. */
    docSelected = computed(() => this.reduceMotion || (this.activeStep() === 0 && this.progress() >= 0.32));

    /** Número de documento tecleado carácter a carácter tras elegir el tipo. */
    docTyped = computed(() => {
        const full = ProductDemoWidget.DOC_NUMBER;
        if (this.reduceMotion) return full;
        if (this.activeStep() !== 0) return '';
        const t = Math.min(Math.max((this.progress() - 0.38) / 0.45, 0), 1);
        return full.slice(0, Math.round(t * full.length));
    });

    /** True cuando el botón Buscar se "presiona" al final del paso 1. */
    searchPressed = computed(() => this.activeStep() === 0 && this.progress() >= 0.9);

    // ── Paso 4: score de riesgo ───────────────────────────────────────
    /** Barra del score del paso 4: llega a 87 en la primera mitad del paso. */
    scoreFill = computed(() => {
        if (this.reduceMotion) return 87;
        if (this.activeStep() !== 3) return 0;
        return Math.round(Math.min(this.progress() * 2, 1) * 87);
    });

    // ── Paso 2: carga del PDF ─────────────────────────────────────────
    /**
     * Carga del PDF del paso 2 (0–100): arranca cuando el archivo "aterriza"
     * (~30% del paso, cuando termina la animación de caída) y completa al 80%.
     */
    pdfUpload = computed(() => {
        if (this.reduceMotion) return 100;
        if (this.activeStep() !== 1) return 0;
        return Math.round(Math.min(Math.max((this.progress() - 0.3) / 0.5, 0), 1) * 100);
    });

    /** True cuando el PDF del paso 2 terminó de subir: la IA ya leyó las cifras. */
    pdfDone = computed(() => this.reduceMotion || (this.activeStep() === 1 && this.progress() >= 0.8));

    private observer?: IntersectionObserver;
    private rafId?: number;
    private stepStart: number | null = null;
    private running = false;

    constructor() {
        afterNextRender(() => this.observeDemo());
    }

    private observeDemo(): void {
        const element = this.demoRef()?.nativeElement;
        if (this.reduceMotion || !element) return;

        // A diferencia de los contadores del hero, este observer queda vivo:
        // el ciclo arranca al entrar al viewport y se pausa al salir.
        this.observer = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? this.start() : this.stop()),
            { threshold: 0.2 }
        );
        this.observer.observe(element);
    }

    private start(): void {
        if (this.running) return;
        this.running = true;
        this.stepStart = null;
        this.rafId = requestAnimationFrame(this.tick);
    }

    private stop(): void {
        this.running = false;
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
    }

    private tick = (timestamp: number): void => {
        if (!this.running) return;
        this.stepStart ??= timestamp;
        const progress = Math.min((timestamp - this.stepStart) / ProductDemoWidget.STEP_MS, 1);
        this.progress.set(progress);
        if (progress >= 1) {
            this.activeStep.update((s) => (s + 1) % this.steps.length);
            this.stepStart = timestamp;
            this.progress.set(0);
        }
        this.rafId = requestAnimationFrame(this.tick);
    };

    /** Los dots permiten saltar de paso; el ciclo continúa solo desde ahí. */
    goToStep(index: number): void {
        this.activeStep.set(index);
        this.progress.set(0);
        this.stepStart = null;
    }

    ngOnDestroy(): void {
        this.stop();
        this.observer?.disconnect();
    }
}
