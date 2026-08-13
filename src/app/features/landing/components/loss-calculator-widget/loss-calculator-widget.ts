import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { afterNextRender, Component, computed, effect, ElementRef, inject, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { AnalyticsService } from '@/app/core/services/analytics.service';

/**
 * Calculadora de cartera vencida (/precios): el visitante mueve sus propias
 * cifras y ve cuánto dinero arriesga al año vendiendo a crédito sin analizar.
 * Es una estimación ilustrativa, no una promesa de recuperación.
 */
@Component({
    standalone: true,
    selector: 'loss-calculator-widget',
    imports: [CurrencyPipe, DecimalPipe, FormsModule, SliderModule, ScrollAnimateDirective],
    templateUrl: './loss-calculator-widget.html'
})
export class LossCalculatorWidget implements OnDestroy {
    private analytics = inject(AnalyticsService);
    /** True tras la primera interacción con un slider (se reporta una sola vez). */
    private interacted = false;

    readonly salesMin = 5_000_000;
    readonly salesMax = 500_000_000;
    readonly salesStep = 5_000_000;

    /** Ventas a crédito al mes (COP). */
    monthlySales = signal(50_000_000);
    /** Porcentaje de la cartera que nunca se recupera. */
    badDebtPercent = signal(3);

    monthlyLoss = computed(() => (this.monthlySales() * this.badDebtPercent()) / 100);
    annualLoss = computed(() => this.monthlyLoss() * 12);

    /** Valor pintado en pantalla: persigue a annualLoss con un tween corto. */
    displayedLoss = signal(0);

    cardRef = viewChild<ElementRef<HTMLElement>>('calc');

    /** True cuando la tarjeta ya entró al viewport (dispara el primer conteo). */
    private entered = signal(false);
    private observer?: IntersectionObserver;
    private rafId?: number;
    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    constructor() {
        afterNextRender(() => this.observeCard());

        effect(() => {
            const target = this.annualLoss();
            if (this.entered()) {
                // untracked: el tween lee displayedLoss (su punto de partida) y sin
                // esto cada frame re-dispararía el efecto, reiniciando el tween.
                untracked(() => this.tweenTo(target));
            }
        });
    }

    scrollToPacks(): void {
        document.getElementById('packs')?.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth' });
    }

    /** Reporta (una vez) que el visitante movió los sliders: es un lead tibio. */
    onInteract(): void {
        if (this.interacted) return;
        this.interacted = true;
        this.analytics.calculatorInteract();
    }

    private observeCard(): void {
        const element = this.cardRef()?.nativeElement;

        if (this.reduceMotion || !element) {
            this.entered.set(true);
            return;
        }

        this.observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    this.entered.set(true);
                    this.observer?.disconnect();
                }
            },
            { threshold: 0.35 }
        );
        this.observer.observe(element);
    }

    private tweenTo(target: number): void {
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.reduceMotion) {
            this.displayedLoss.set(target);
            return;
        }

        const from = this.displayedLoss();
        const duration = 500;
        let start: number | null = null;

        const step = (timestamp: number) => {
            start ??= timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            this.displayedLoss.set(Math.round(from + (target - from) * eased));
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
