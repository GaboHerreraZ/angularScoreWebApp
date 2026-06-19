import { afterNextRender, Component, computed, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'features-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './features-widget.html'
})
export class FeaturesWidget implements OnDestroy {
    /** Valor final del score que muestra el medidor del showcase. */
    private static readonly TARGET_SCORE = 87;

    /** Radio del anillo SVG; se usa para calcular la circunferencia. */
    readonly radius = 52;
    readonly circumference = 2 * Math.PI * this.radius;

    /** Las cuatro dimensiones que componen el score (cada una sobre 25). */
    readonly dimensions = [
        { label: 'Salud financiera', value: 22, color: 'bg-emerald-500' },
        { label: 'Capacidad de pago', value: 24, color: 'bg-blue-500' },
        { label: 'Coherencia de plazos', value: 20, color: 'bg-purple-500' },
        { label: 'Adecuación del cupo', value: 21, color: 'bg-orange-500' }
    ];

    showcaseRef = viewChild<ElementRef<HTMLElement>>('showcase');

    /** Enciende el medidor y las barras al entrar al viewport. */
    animate = signal(false);
    /** Score que se va contando de 0 al valor final. */
    score = signal(0);

    /** Trazo del anillo: 0 cuando aún no anima, proporcional al score si anima. */
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
            this.score.set(FeaturesWidget.TARGET_SCORE);
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
        const target = FeaturesWidget.TARGET_SCORE;
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
