import { afterNextRender, Component, computed, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';
import { SupabaseService } from '@/app/core/services/supabase.service';

/** Estado visual de un paso de la línea de tiempo. */
type StepState = 'pending' | 'active' | 'done';

@Component({
    standalone: true,
    selector: 'join-widget',
    imports: [ButtonModule, Ripple, ScrollAnimateDirective, RouterModule],
    templateUrl: './join-widget.html'
})
export class JoinWidget implements OnDestroy {
    /** Duración del recorrido completo de la línea de tiempo. */
    private static readonly TL_MS = 3200;

    private supabaseService = inject(SupabaseService);

    /** True si el usuario ya tiene sesión: el CTA final pasa a "Ir al Dashboard". */
    isAuthenticated = computed(() => this.supabaseService.isAuthenticated());

    /** La ruta de arranque completa, para que nadie tema un proceso largo. */
    readonly steps = [
        { title: 'Crea tu cuenta', description: 'Con tu correo o con Google.', time: '≈ 1 min' },
        { title: 'Registra tu empresa', description: 'Datos básicos y de facturación.', time: '≈ 3 min' },
        { title: 'Compra y analiza', description: 'Elige un paquete y evalúa a tu primer cliente.', time: '≈ 2 min' }
    ];

    /** Micro-confianza bajo los CTAs. */
    readonly assurances = ['Pago único por paquete', 'Listo para operar en minutos', 'Acompañamiento personalizado'];

    timelineRef = viewChild<ElementRef<HTMLElement>>('timeline');

    /** Avance de la línea de tiempo (0–1). */
    tl = signal(0);

    /** Relleno del conector entre los pasos 1→2 y 2→3. */
    seg1 = computed(() => Math.min(Math.max((this.tl() - 0.08) / 0.34, 0), 1));
    seg2 = computed(() => Math.min(Math.max((this.tl() - 0.52) / 0.34, 0), 1));

    private readonly reduceMotion = typeof matchMedia !== 'undefined'
        && matchMedia('(prefers-reduced-motion: reduce)').matches;

    private observer?: IntersectionObserver;
    private rafId?: number;
    private startTs: number | null = null;
    private playing = false;

    constructor() {
        afterNextRender(() => this.observeTimeline());
    }

    /** Estado de cada paso según el avance: se enciende y luego se marca hecho. */
    stepState(index: number): StepState {
        const activeAt = [0, 0.42, 0.86];
        const doneAt = [0.42, 0.86, 0.97];
        const t = this.tl();
        if (t >= doneAt[index]) return 'done';
        if (t >= activeAt[index]) return 'active';
        return 'pending';
    }

    private observeTimeline(): void {
        const element = this.timelineRef()?.nativeElement;

        // Sin movimiento o sin elemento: la ruta se muestra completa y quieta.
        if (this.reduceMotion || !element) {
            this.tl.set(1);
            return;
        }

        this.observer = new IntersectionObserver(
            ([entry]) => (entry.isIntersecting ? this.play() : this.reset()),
            { threshold: 0.35 }
        );
        this.observer.observe(element);
    }

    private play(): void {
        if (this.playing) return;
        this.playing = true;
        this.startTs = null;
        this.rafId = requestAnimationFrame(this.tick);
    }

    private reset(): void {
        this.playing = false;
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
        this.tl.set(0);
    }

    private tick = (timestamp: number): void => {
        if (!this.playing) return;
        this.startTs ??= timestamp;
        const progress = Math.min((timestamp - this.startTs) / JoinWidget.TL_MS, 1);
        this.tl.set(progress);
        if (progress < 1) {
            this.rafId = requestAnimationFrame(this.tick);
        } else {
            this.playing = false;
        }
    };

    ngOnDestroy(): void {
        this.playing = false;
        if (this.rafId !== undefined) {
            cancelAnimationFrame(this.rafId);
        }
        this.observer?.disconnect();
    }
}
