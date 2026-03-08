import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({
    standalone: true,
    selector: '[appScrollAnimate]'
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
    @Input('appScrollAnimate') animation: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' | 'scale-in' = 'fade-up';
    @Input() animateDelay = 0;

    private el = inject(ElementRef);
    private observer!: IntersectionObserver;

    ngOnInit() {
        const element = this.el.nativeElement as HTMLElement;
        element.classList.add('scroll-animate', `scroll-${this.animation}`);

        if (this.animateDelay > 0) {
            element.style.transitionDelay = `${this.animateDelay}ms`;
        }

        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.classList.add('scroll-animated');
                    this.observer.unobserve(element);
                }
            },
            { threshold: 0.1 }
        );

        this.observer.observe(element);
    }

    ngOnDestroy() {
        this.observer?.disconnect();
    }
}
