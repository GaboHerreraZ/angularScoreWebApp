import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, effect, ElementRef, input, signal, TemplateRef, viewChild } from '@angular/core';

/**
 * Carrusel horizontal de tarjetas basado en scroll nativo con snap: muestra
 * 3 tarjetas en desktop (2 en tablet, 1 en móvil) y avanza de a una, ya sea
 * con las flechas laterales, arrastrando con el mouse o con swipe táctil.
 * El contenido de cada ítem se proyecta vía `ng-template` con el ítem como
 * contexto implícito, así cada pantalla decide qué tarjeta renderizar.
 *
 * @example
 * ```html
 * <app-card-carousel [items]="packs()">
 *     <ng-template let-pack>
 *         <app-pack-display-card [pack]="pack" />
 *     </ng-template>
 * </app-card-carousel>
 * ```
 */
@Component({
    selector: 'app-card-carousel',
    standalone: true,
    imports: [NgTemplateOutlet],
    templateUrl: './card-carousel.html',
    host: { '(window:resize)': 'updateNav()' }
})
export class CardCarousel {
    items = input.required<unknown[]>();

    /**
     * Clases de ancho de cada ítem (cuántas tarjetas caben por vista). El
     * default muestra 3 en desktop; un contenedor angosto (p. ej. una columna
     * de un layout a dos) puede pasar 'w-full sm:w-1/2' para mostrar 2.
     */
    itemClass = input<string>('w-full sm:w-1/2 lg:w-1/3');

    itemTemplate = contentChild.required<TemplateRef<any>>(TemplateRef);
    private viewportRef = viewChild<ElementRef<HTMLElement>>('viewport');

    /** Hay contenido hacia atrás/adelante; controlan el estado de las flechas. */
    canPrev = signal(false);
    canNext = signal(false);
    /** True mientras el usuario arrastra con el mouse. */
    dragging = signal(false);
    /**
     * El snap CSS se apaga durante el arrastre (pelearía con el scroll manual)
     * y se restaura una vez la tarjeta más cercana termina de acomodarse.
     */
    snapEnabled = signal(true);

    private pointerId: number | null = null;
    private dragStartX = 0;
    private dragStartScroll = 0;
    private moved = false;

    constructor() {
        // El catálogo llega async: recalcular flechas cuando cambian los ítems.
        effect(() => {
            this.items();
            requestAnimationFrame(() => this.updateNav());
        });
    }

    private viewport(): HTMLElement | null {
        return this.viewportRef()?.nativeElement ?? null;
    }

    /** Ancho de un ítem (todas las tarjetas miden lo mismo); es el paso de avance. */
    private itemWidth(): number {
        return this.viewport()?.querySelector<HTMLElement>('[data-carousel-item]')?.offsetWidth ?? 0;
    }

    updateNav(): void {
        const vp = this.viewport();
        if (!vp) return;
        this.canPrev.set(vp.scrollLeft > 4);
        this.canNext.set(vp.scrollLeft < vp.scrollWidth - vp.clientWidth - 4);
    }

    prev(): void {
        this.viewport()?.scrollBy({ left: -this.itemWidth(), behavior: 'smooth' });
    }

    next(): void {
        this.viewport()?.scrollBy({ left: this.itemWidth(), behavior: 'smooth' });
    }

    onPointerDown(event: PointerEvent): void {
        // Solo arrastre con mouse: el táctil ya scrollea nativo con snap.
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        const vp = this.viewport();
        if (!vp) return;
        this.pointerId = event.pointerId;
        this.dragStartX = event.clientX;
        this.dragStartScroll = vp.scrollLeft;
        this.moved = false;
    }

    onPointerMove(event: PointerEvent): void {
        if (this.pointerId !== event.pointerId) return;
        const vp = this.viewport();
        if (!vp) return;
        const dx = event.clientX - this.dragStartX;
        // Umbral para no confundir un click sobre la tarjeta con un arrastre.
        if (!this.moved && Math.abs(dx) < 5) return;
        if (!this.moved) {
            this.moved = true;
            this.dragging.set(true);
            this.snapEnabled.set(false);
            vp.setPointerCapture(event.pointerId);
        }
        vp.scrollLeft = this.dragStartScroll - dx;
    }

    onPointerUp(event: PointerEvent): void {
        if (this.pointerId !== event.pointerId) return;
        this.pointerId = null;
        if (!this.moved) return;
        this.snapToNearest();
        // El reset queda para después del click fantasma que sigue al pointerup,
        // así el pointer-events-none de los ítems lo absorbe y no dispara el CTA.
        setTimeout(() => {
            this.dragging.set(false);
            this.moved = false;
        });
        // Se restaura el snap cuando el scroll suave ya llegó a una posición alineada.
        setTimeout(() => this.snapEnabled.set(true), 400);
    }

    /** Al soltar el arrastre, acomoda el viewport en la tarjeta más cercana. */
    private snapToNearest(): void {
        const vp = this.viewport();
        const step = this.itemWidth();
        if (!vp || !step) return;
        const index = Math.round(vp.scrollLeft / step);
        vp.scrollTo({ left: index * step, behavior: 'smooth' });
    }
}
