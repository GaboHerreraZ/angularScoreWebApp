import { afterNextRender, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'hero-widget',
    imports: [ButtonModule, Ripple, ScrollAnimateDirective],
    templateUrl: './hero-widget.html'
})
export class HeroWidget implements OnDestroy {
    /** Valor final del score que se muestra en el mockup. */
    private static readonly TARGET_SCORE = 87;

    mockupRef = viewChild<ElementRef<HTMLElement>>('mockup');

    /** Dispara las animaciones del mockup cuando entra al viewport. */
    animate = signal(false);
    /** Score que se va contando de 0 al valor final. */
    score = signal(0);

    private observer?: IntersectionObserver;
    private rafId?: number;
    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() {
        // afterNextRender corre solo en el navegador y cuando la vista ya existe,
        // por lo que el viewChild.required ya tiene valor.
        afterNextRender(() => this.observeMockup());
    }

    private observeMockup(): void {
        const element = this.mockupRef()?.nativeElement;

        // Sin movimiento o sin elemento (p. ej. SSR): mostramos el estado final.
        if (this.reduceMotion || !element) {
            this.score.set(HeroWidget.TARGET_SCORE);
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
        const target = HeroWidget.TARGET_SCORE;
        const duration = 1100;
        let start: number | null = null;

        const step = (timestamp: number) => {
            start ??= timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            // easeOutCubic para que desacelere al final.
            const eased = 1 - Math.pow(1 - progress, 3);
            this.score.set(Math.round(eased * target));
            if (progress < 1) {
                this.rafId = requestAnimationFrame(step);
            }
        };
        this.rafId = requestAnimationFrame(step);
    }

    scrollTo(id: string) {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
    }
}
