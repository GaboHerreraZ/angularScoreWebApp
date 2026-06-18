import { afterNextRender, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'how-it-works-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './how-it-works-widget.html'
})
export class HowItWorksWidget implements OnDestroy {
    stepsRef = viewChild<ElementRef<HTMLElement>>('steps');

    /** Enciende la línea conectora y los pasos en cascada al entrar al viewport. */
    animate = signal(false);

    private observer?: IntersectionObserver;
    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() {
        afterNextRender(() => this.observeSteps());
    }

    private observeSteps(): void {
        const element = this.stepsRef()?.nativeElement;

        // Sin movimiento o sin elemento (p. ej. SSR): mostramos el estado final.
        if (this.reduceMotion || !element) {
            this.animate.set(true);
            return;
        }

        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    this.animate.set(true);
                    this.observer?.disconnect();
                }
            },
            { threshold: 0.3 }
        );
        this.observer.observe(element);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }
}
