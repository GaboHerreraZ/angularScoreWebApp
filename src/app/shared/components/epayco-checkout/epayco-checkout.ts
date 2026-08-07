import { Component, inject, input, output, signal } from '@angular/core';
import { EpaycoCheckoutLoader } from './epayco-checkout.service';
import {
    EpaycoCheckoutHandler,
    EpaycoCheckoutType,
    EpaycoResponse
} from '@/app/types/epayco';
import { environment } from '@/environments/environment';

/**
 * Componente reutilizable que orquesta el Smart Checkout v2 de ePayco.
 *
 * No renderiza UI: el padre dispara el pago llamando al método público
 * `open()` (vía template ref) y reacciona a los outputs que reflejan los
 * hooks de ePayco. El `sessionId` lo crea el backend con la llave privada.
 *
 * @example
 * ```html
 * <app-epayco-checkout
 *     #checkout
 *     [sessionId]="sessionId()"
 *     (paid)="onPaid($event)"
 *     (closed)="onClosed()"
 * />
 * <p-button label="Pagar" (onClick)="checkout.open()" />
 * ```
 */
@Component({
    selector: 'app-epayco-checkout',
    standalone: true,
    template: '' // Orquestador sin presentación.
})
export class EpaycoCheckout {
    private loader = inject(EpaycoCheckoutLoader);

    /** Id de sesión creado por el backend (POST /payment/session/create). */
    sessionId = input.required<string>();
    /** Modo de presentación: 'onpage' (modal embebido) o 'standard' (redirección). */
    type = input<EpaycoCheckoutType>('onpage');
    /** Ambiente de pruebas. Por defecto lo decide el environment. */
    test = input<boolean>(environment.epaycoTest);
    /** Cómo abrir el checkout: 'modal' usa open(); 'newWindow' usa openNew(). */
    display = input<'modal' | 'newWindow'>('modal');

    /** Emite cuando el checkout se abre correctamente. */
    created = output<unknown>();
    /** Emite el resultado de la transacción cuando el pago se procesa. */
    response = output<EpaycoResponse>();
    /** Emite cuando ocurre un error durante el procesamiento. */
    errored = output<unknown>();
    /** Emite cuando el usuario cierra el checkout. */
    closed = output<unknown>();

    /** Indica si se está cargando el script / abriendo el checkout. */
    loading = signal(false);

    private handler: EpaycoCheckoutHandler | null = null;

    /**
     * Carga el script (si hace falta), configura el handler con la sesión
     * y abre el checkout.
     *
     * Acepta un `sessionId` opcional con prioridad sobre el input: cuando el
     * padre acaba de recibir el id del backend y llama a open() en el mismo
     * tick, el input aún no se propagó, así que conviene pasarlo directo.
     */
    async open(sessionId?: string): Promise<void> {
        if (this.loading()) return;

        const id = sessionId ?? this.sessionId();
        if (!id) {
            this.errored.emit(new Error('Falta el sessionId para abrir el checkout de ePayco.'));
            return;
        }

        this.loading.set(true);
        try {
            await this.loader.load();

            const ePayco = window.ePayco;
            if (!ePayco) {
                throw new Error('El checkout de ePayco no está disponible.');
            }

            // Reconfiguramos en cada apertura: la sesión puede cambiar entre pagos.
            this.handler = ePayco.checkout.configure({
                sessionId: id,
                type: this.type(),
                test: this.test()
            });

            this.handler.setHooks({
                onCreated: (data) => this.created.emit(data),
                onResponse: (res) => this.response.emit(res),
                onErrors: (err) => this.errored.emit(err),
                onClosed: (err) => this.closed.emit(err)
            });

            if (this.display() === 'newWindow') {
                this.handler.openNew();
            } else {
                this.handler.open();
            }
        } catch (error) {
            this.errored.emit(error);
        } finally {
            this.loading.set(false);
        }
    }
}
