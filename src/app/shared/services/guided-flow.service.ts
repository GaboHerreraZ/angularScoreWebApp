import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { driver, type Driver } from 'driver.js';
import { FlowDefinition, FlowStep, TourSeenMap } from '@/app/types/tour';
import { FLOWS } from '@/app/shared/tours';
import { NotificationService } from '@/app/shared/components/notification/notification.service';
import { TourService } from './tour.service';

const DONE_KEY = 'creditia.flows.v1';
const ACTIVE_KEY = 'creditia.flows.active.v1';
const DESKTOP_MIN_WIDTH = 992;
const ELEMENT_TIMEOUT_MS = 20000;
const POLL_MS = 300;
const BODY_CLASS = 'creditia-flow-active';

interface ActiveFlowState {
    id: string;
    index: number;
    version: number;
}

/**
 * Motor de tareas guiadas. El usuario ejecuta la acción real de cada paso y la
 * guía avanza sola al detectarla (navegación o aparición de un elemento). El
 * estado activo vive en sessionStorage para sobrevivir las navegaciones que el
 * propio flujo provoca, incluido un refresh de la página a mitad de tarea.
 */
@Injectable({ providedIn: 'root' })
export class GuidedFlowService {
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly notification = inject(NotificationService);
    private readonly tourService = inject(TourService);

    readonly flows: FlowDefinition[] = FLOWS;
    readonly running = signal<string | null>(null);

    private readonly done = signal<TourSeenMap>(this.read<TourSeenMap>(DONE_KEY, localStorage));

    private state: ActiveFlowState | null = null;
    private instance: Driver | null = null;
    private advancing = false;
    private watchers: number[] = [];

    constructor() {
        this.state = this.restoreActive();
        if (this.state) {
            this.running.set(this.state.id);
            // La app puede estar recién cargada: engancha el paso cuando exista el DOM.
            setTimeout(() => this.syncWithUrl(this.normalize(this.router.url), true));
        }

        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((e) => this.syncWithUrl(this.normalize(e.urlAfterRedirects), false));
    }

    isCompleted(flow: FlowDefinition): boolean {
        const record = this.done()[flow.id];
        return !!record && record.version >= flow.version && !record.skipped;
    }

    start(flowId: string): void {
        const flow = this.flows.find((f) => f.id === flowId);
        if (!flow) return;

        if (window.innerWidth < DESKTOP_MIN_WIDTH) {
            this.notification.info('Las tareas guiadas están pensadas para pantalla grande. Repítela desde un computador.', 'Mejor en escritorio');
            return;
        }

        this.tourService.stop();
        this.teardown();
        this.state = { id: flow.id, index: 0, version: flow.version };
        this.persistActive();
        this.running.set(flow.id);

        if (this.matches(flow.steps[0].route, this.normalize(this.router.url))) {
            void this.runStep();
        } else {
            // syncWithUrl levanta el primer paso cuando termine la navegación.
            void this.router.navigateByUrl(flow.startRoute);
        }
    }

    /** Abandona la tarea activa (cierre del usuario o cambio de contexto). */
    cancel(notify = true): void {
        if (!this.state) return;
        this.teardown();
        this.state = null;
        this.persistActive();
        this.running.set(null);
        if (notify) this.notification.info('Puedes retomarla cuando quieras desde el botón de guías.', 'Tarea guiada cancelada');
    }

    // ─── Motor ───────────────────────────────────────────────────────────────

    private syncWithUrl(url: string, silent: boolean): void {
        const step = this.currentStep();
        if (!step) return;

        if (step.advance.on === 'route' && this.matches(step.advance.pattern, url)) {
            this.advance();
            return;
        }
        if (this.matches(step.route, url)) {
            void this.runStep();
            return;
        }
        // Navegó a una pantalla ajena al paso actual: la tarea pierde sentido.
        this.cancel(!silent);
    }

    private advance(): void {
        const flow = this.currentFlow();
        if (!flow || !this.state) return;

        this.clearWatchers();
        this.destroyInstance();

        const index = this.state.index + 1;
        if (index >= flow.steps.length) {
            this.complete(flow);
            return;
        }

        this.state = { ...this.state, index };
        this.persistActive();

        if (this.matches(flow.steps[index].route, this.normalize(this.router.url))) {
            void this.runStep();
        }
        // Si el paso vive en otra ruta, syncWithUrl lo levanta al navegar.
    }

    private complete(flow: FlowDefinition): void {
        this.teardown();
        this.state = null;
        this.persistActive();
        this.running.set(null);

        this.done.update((prev) => ({
            ...prev,
            [flow.id]: { version: flow.version, seenAt: new Date().toISOString(), skipped: false }
        }));
        this.write(DONE_KEY, this.done(), localStorage);
        this.notification.success(`Completaste “${flow.title}”.`, '¡Tarea terminada!');
    }

    private async runStep(): Promise<void> {
        const flow = this.currentFlow();
        const step = this.currentStep();
        if (!flow || !step || !this.state) return;

        this.clearWatchers();
        this.destroyInstance();
        document.body.classList.add(BODY_CLASS);

        const indexAtStart = this.state.index;
        if (step.element) {
            const el = await this.waitForElement(step.element, indexAtStart);
            if (!this.state || this.state.index !== indexAtStart || this.state.id !== flow.id) return;
            if (!el) {
                this.notification.warn('La pantalla no mostró el elemento esperado. Inténtalo de nuevo cuando termine de cargar.', 'La guía no pudo continuar');
                this.cancel(false);
                return;
            }
        }

        this.render(flow, step);
        this.watchStep(flow, step);
    }

    private render(flow: FlowDefinition, step: FlowStep): void {
        if (!this.state) return;
        const passive = step.advance.on === 'next';
        const last = this.state.index === flow.steps.length - 1;

        const instance = driver({
            steps: [
                {
                    element: step.element,
                    popover: {
                        title: step.title,
                        description: this.describe(step),
                        side: step.side,
                        align: step.align,
                        showButtons: passive ? ['next', 'close'] : ['close']
                    }
                }
            ],
            showProgress: true,
            progressText: `Paso ${this.state.index + 1} de ${flow.steps.length}`,
            // En un driver de un solo paso el botón "next" se pinta como "done".
            doneBtnText: last ? 'Finalizar' : 'Siguiente',
            allowClose: true,
            smoothScroll: true,
            animate: !this.prefersReducedMotion(),
            stagePadding: 6,
            stageRadius: 8,
            popoverClass: 'creditia-tour creditia-flow',
            overlayColor: '#0f172a',
            overlayOpacity: 0.55,
            overlayClickBehavior: 'close',
            onNextClick: () => this.advance(),
            onPopoverRender: (popover) => {
                popover.closeButton.setAttribute('aria-label', 'Cancelar tarea guiada');
                popover.closeButton.setAttribute('title', 'Cancelar tarea guiada');
            },
            onDestroyed: () => {
                if (this.instance === instance) this.instance = null;
                // Si el motor no provocó el cierre, lo hizo el usuario: abandona.
                if (!this.advancing) this.cancel(true);
            }
        });

        this.instance = instance;
        instance.drive();
    }

    /**
     * Vigila la condición de avance y mantiene el popover coherente: si el
     * elemento resaltado desaparece o un diálogo ajeno al paso está abierto
     * (loader de extracción, confirmaciones), colapsa el popover sin cancelar y
     * lo restaura después. Mientras está visible lo reposiciona, porque el
     * scroll de la app ocurre en `.layout-content` y driver.js no lo escucha.
     */
    private watchStep(flow: FlowDefinition, step: FlowStep): void {
        const advance = step.advance;
        const indexAtStart = this.state?.index ?? -1;

        const id = window.setInterval(() => {
            if (!this.state || this.state.index !== indexAtStart) {
                window.clearInterval(id);
                return;
            }
            if (advance.on === 'appear' && document.querySelector(advance.element)) {
                this.advance();
                return;
            }
            if (!step.element) return;
            const el = document.querySelector(step.element);
            const blocked = !el || this.blockedByForeignDialog(el);
            if (blocked && this.instance) this.destroyInstance();
            else if (!blocked && !this.instance) this.render(flow, step);
            else if (!blocked) this.instance?.refresh();
        }, POLL_MS);
        this.watchers.push(id);
    }

    /** ¿Hay un diálogo abierto que no contiene al elemento del paso? */
    private blockedByForeignDialog(el: Element): boolean {
        const masks = document.querySelectorAll('.p-dialog-mask');
        for (let i = 0; i < masks.length; i++) {
            if (!masks[i].contains(el)) return true;
        }
        return false;
    }

    private waitForElement(selector: string, indexAtStart: number): Promise<Element | null> {
        const found = document.querySelector(selector);
        if (found) return Promise.resolve(found);

        return new Promise((resolve) => {
            const startedAt = Date.now();
            const id = window.setInterval(() => {
                if (!this.state || this.state.index !== indexAtStart) {
                    window.clearInterval(id);
                    resolve(null);
                    return;
                }
                const el = document.querySelector(selector);
                if (el) {
                    window.clearInterval(id);
                    resolve(el);
                    return;
                }
                if (Date.now() - startedAt > ELEMENT_TIMEOUT_MS) {
                    window.clearInterval(id);
                    resolve(null);
                }
            }, POLL_MS);
            this.watchers.push(id);
        });
    }

    private describe(step: FlowStep): string {
        if (step.advance.on === 'next') return step.description;
        return `${step.description}<div class="flow-action"><i class="pi pi-hand-pointer"></i><span>Este paso lo haces tú: la guía avanza sola cuando lo completes.</span></div>`;
    }

    // ─── Limpieza ────────────────────────────────────────────────────────────

    private teardown(): void {
        this.clearWatchers();
        this.destroyInstance();
        document.body.classList.remove(BODY_CLASS);
    }

    private destroyInstance(): void {
        const instance = this.instance;
        if (!instance) return;
        this.instance = null;
        this.advancing = true;
        try {
            if (instance.isActive()) instance.destroy();
        } finally {
            this.advancing = false;
        }
    }

    private clearWatchers(): void {
        for (const id of this.watchers) window.clearInterval(id);
        this.watchers = [];
    }

    // ─── Utilidades ──────────────────────────────────────────────────────────

    private currentFlow(): FlowDefinition | null {
        if (!this.state) return null;
        const id = this.state.id;
        return this.flows.find((f) => f.id === id) ?? null;
    }

    private currentStep(): FlowStep | null {
        const flow = this.currentFlow();
        if (!flow || !this.state) return null;
        return flow.steps[this.state.index] ?? null;
    }

    private matches(pattern: string, url: string): boolean {
        return pattern.startsWith('^') ? new RegExp(pattern).test(url) : url === pattern;
    }

    private normalize(url: string): string {
        return url.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
    }

    private restoreActive(): ActiveFlowState | null {
        const state = this.read<Partial<ActiveFlowState>>(ACTIVE_KEY, sessionStorage);
        if (typeof state.id !== 'string' || typeof state.index !== 'number') return null;
        const flow = this.flows.find((f) => f.id === state.id);
        if (!flow || flow.version !== state.version || state.index >= flow.steps.length) return null;
        return state as ActiveFlowState;
    }

    private persistActive(): void {
        try {
            if (this.state) sessionStorage.setItem(ACTIVE_KEY, JSON.stringify(this.state));
            else sessionStorage.removeItem(ACTIVE_KEY);
        } catch {
        }
    }

    private prefersReducedMotion(): boolean {
        return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    }

    private read<T extends object>(key: string, storage: Storage): T {
        try {
            const raw = storage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : ({} as T);
        } catch {
            return {} as T;
        }
    }

    private write(key: string, value: unknown, storage: Storage): void {
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch {
        }
    }
}
