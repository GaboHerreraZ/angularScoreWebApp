import { afterNextRender, Component, computed, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'benefits-widget',
    imports: [RouterModule, ScrollAnimateDirective],
    templateUrl: './benefits-widget.html'
})
export class BenefitsWidget implements OnDestroy {
    /** Valor final del score que muestra el medidor. */
    private static readonly TARGET_SCORE = 87;

    /** Radio del anillo SVG; se usa para calcular la circunferencia. */
    readonly radius = 52;
    readonly circumference = 2 * Math.PI * this.radius;

    /** Puntaje máximo de cada dimensión (5 dimensiones × 20 = 100). */
    readonly dimensionMax = 20;

    /** Las cinco dimensiones que componen el score (cada una sobre 20). */
    readonly dimensions = [
        { label: 'Salud financiera', value: 17, color: 'bg-emerald-500' },
        { label: 'Capacidad de pago', value: 19, color: 'bg-blue-500' },
        { label: 'Riesgo de la central', value: 18, color: 'bg-red-500' },
        { label: 'Coherencia de plazos', value: 16, color: 'bg-purple-500' },
        { label: 'Adecuación del monto', value: 17, color: 'bg-orange-500' }
    ];

    /** Resultados y garantías que el recorrido del producto no cuenta. */
    readonly extras = [
        { icon: 'pi-verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Respaldo legal', description: 'Cada aprobación cierra con un pagaré con validez jurídica.' },
        { icon: 'pi-chart-bar', color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Dashboard de cartera', description: 'Distribución de riesgo en un solo lugar.' },
        { icon: 'pi-file-excel', color: 'text-pink-500', bg: 'bg-pink-500/10', title: 'Exportes en Excel', description: 'Clientes y estudios listos para auditoría.' },
        { icon: 'pi-lock', color: 'text-blue-500', bg: 'bg-blue-500/10', title: 'Seguridad y Habeas Data', description: 'Cifrado AES-256 y Ley 1581 de 2012.' }
    ];

    showcaseRef = viewChild<ElementRef<HTMLElement>>('showcase');

    /** Enciende el medidor y las barras al entrar al viewport. */
    animate = signal(false);
    /** Score que se va contando de 0 al valor final. */
    score = signal(0);

    /** Trazo del anillo: proporcional al score mientras cuenta. */
    dashOffset = computed(() => {
        const progress = this.score() / 100;
        return this.circumference * (1 - progress);
    });

    private observer?: IntersectionObserver;
    private rafId?: number;
    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() {
        afterNextRender(() => this.observeShowcase());
    }

    private observeShowcase(): void {
        const element = this.showcaseRef()?.nativeElement;

        // Sin movimiento o sin elemento (p. ej. SSR): mostramos el estado final.
        if (this.reduceMotion || !element) {
            this.score.set(BenefitsWidget.TARGET_SCORE);
            this.animate.set(true);
            return;
        }

        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    this.animate.set(true);
                    this.countUpScore();
                    this.observer?.disconnect();
                }
            },
            { threshold: 0.4 }
        );
        this.observer.observe(element);
    }

    private countUpScore(): void {
        const target = BenefitsWidget.TARGET_SCORE;
        const duration = 1100;
        let start: number | null = null;

        const step = (timestamp: number) => {
            start ??= timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            this.score.set(Math.round(eased * target));
            if (progress < 1) {
                this.rafId = requestAnimationFrame(step);
            }
        };
        this.rafId = requestAnimationFrame(step);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
    }
}
