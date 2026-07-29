import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { driver, type Config, type DriveStep, type Driver } from 'driver.js';
import { TourDefinition, TourSeenMap, TourStep } from '@/app/types/tour';
import { TOURS } from '@/app/shared/tours';
import { NotificationService } from '@/app/shared/components/notification/notification.service';

const SEEN_KEY = 'creditia.tours.v1';
const ACK_KEY = 'creditia.tours.ack.v1';
const DESKTOP_MIN_WIDTH = 992;

@Injectable({ providedIn: 'root' })
export class TourService {
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly notification = inject(NotificationService);

    private readonly seen = signal<TourSeenMap>(this.read<TourSeenMap>(SEEN_KEY));
    private readonly acked = signal<Record<string, number>>(this.read<Record<string, number>>(ACK_KEY));

    private readonly url = signal<string>(this.normalize(this.router.url));

    readonly running = signal<string | null>(null);

    private instance: Driver | null = null;

    constructor() {
        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((e) => {
                this.url.set(this.normalize(e.urlAfterRedirects));
                this.stop();
            });
    }


    readonly toursForRoute = computed(() => {
        const url = this.url();
        return TOURS.filter((t) => t.kind !== 'welcome' && this.matches(t, url));
    });

    readonly welcomeTour = computed(() => {
        const url = this.url();
        return TOURS.find((t) => t.kind === 'welcome' && this.matches(t, url)) ?? null;
    });

    readonly availableTours = computed(() => {
        const welcome = this.welcomeTour();
        return welcome ? [welcome, ...this.toursForRoute()] : this.toursForRoute();
    });

    readonly hasUndiscoveredTours = computed(() => this.availableTours().some((t) => !this.isDiscovered(t)));

    isCompleted(tour: TourDefinition): boolean {
        const record = this.seen()[tour.id];
        return !!record && record.version >= tour.version && !record.skipped;
    }

    isDiscovered(tour: TourDefinition): boolean {
        const seen = this.seen()[tour.id];
        if (seen && seen.version >= tour.version) return true;
        return (this.acked()[tour.id] ?? -1) >= tour.version;
    }

    acknowledgeCurrentRoute(): void {
        const tours = this.availableTours();
        if (!tours.length) return;

        this.acked.update((prev) => {
            const next = { ...prev };
            for (const tour of tours) next[tour.id] = tour.version;
            return next;
        });
        this.write(ACK_KEY, this.acked());
    }

    start(tourId: string): void {
        const tour = TOURS.find((t) => t.id === tourId);
        if (!tour) return;

        this.stop();

        const steps = this.resolveSteps(tour);
        if (!steps.length) {
            this.notification.info('Espera a que la pantalla termine de cargar e inténtalo de nuevo.', 'La guía aún no está lista');
            return;
        }

        const instance = driver(this.buildConfig(tour, steps));
        this.instance = instance;
        this.running.set(tour.id);
        instance.drive();
    }

    stop(): void {
        if (!this.instance) return;
        const instance = this.instance;
        this.instance = null;
        this.running.set(null);
        if (instance.isActive()) instance.destroy();
    }

    reset(): void {
        this.seen.set({});
        this.acked.set({});
        localStorage.removeItem(SEEN_KEY);
        localStorage.removeItem(ACK_KEY);
    }


    private buildConfig(tour: TourDefinition, steps: DriveStep[]): Config {
        return {
            steps,
            showProgress: steps.length > 1,
            progressText: '{{current}} de {{total}}',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            doneBtnText: 'Entendido',
            allowClose: true,
            smoothScroll: true,
            animate: !this.prefersReducedMotion(),
            stagePadding: 6,
            stageRadius: 8,
            popoverClass: 'creditia-tour',
            overlayColor: '#0f172a',
            overlayOpacity: 0.62,
            overlayClickBehavior: 'close',
            onPopoverRender: (popover) => {
                popover.closeButton.setAttribute('aria-label', 'Saltar guía');
                popover.closeButton.setAttribute('title', 'Saltar guía');
            },
            onDestroyStarted: () => {
                const completed = !this.instance?.hasNextStep();
                this.markSeen(tour, !completed);
                this.instance?.destroy();
            },
            onDestroyed: () => {
                this.instance = null;
                this.running.set(null);
            }
        };
    }

    private resolveSteps(tour: TourDefinition): DriveStep[] {
        const isDesktop = window.innerWidth >= DESKTOP_MIN_WIDTH;

        return tour.steps
            .filter((step) => {
                if (step.desktopOnly && !isDesktop) return false;
                if (!step.element) return true;
                if (document.querySelector(step.element)) return true;
                return step.optional === false;
            })
            .map((step) => this.toDriveStep(step));
    }

    private toDriveStep(step: TourStep): DriveStep {
        return {
            element: step.element,
            popover: {
                title: step.title,
                description: step.description,
                side: step.side,
                align: step.align
            }
        };
    }

    private markSeen(tour: TourDefinition, skipped: boolean): void {
        this.seen.update((prev) => ({
            ...prev,
            [tour.id]: { version: tour.version, seenAt: new Date().toISOString(), skipped }
        }));
        this.write(SEEN_KEY, this.seen());
    }


    private matches(tour: TourDefinition, url: string): boolean {
        return tour.routes.some((route) => {
            if (route === '*') return url.startsWith('/app');
            if (tour.exactRoute) return url === route;
            return url === route || url.startsWith(`${route}/`);
        });
    }

    private normalize(url: string): string {
        return url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    }

    private prefersReducedMotion(): boolean {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    }

    private read<T extends object>(key: string): T {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : ({} as T);
        } catch {
            return {} as T;
        }
    }

    private write(key: string, value: unknown): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
        }
    }
}
