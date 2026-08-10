import { Injectable } from '@angular/core';

/** URL del Smart Checkout v2 de ePayco (hardcodeada por ahora). */
const EPAYCO_CHECKOUT_SCRIPT = 'https://checkout.epayco.co/checkout-v2.js';

/**
 * Carga el script del checkout de ePayco una sola vez y lo comparte entre
 * todos los componentes que lo necesiten. La promesa se cachea para que
 * llamadas concurrentes no inyecten el script más de una vez.
 */
@Injectable({ providedIn: 'root' })
export class EpaycoCheckoutLoader {
    private loadPromise: Promise<void> | null = null;

    load(): Promise<void> {
        if (window.ePayco) {
            return Promise.resolve();
        }
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = new Promise<void>((resolve, reject) => {
            // Un script previo sin window.ePayco es un intento fallido: sus eventos
            // load/error ya dispararon, así que escucharlo de nuevo dejaría esta
            // promesa colgada para siempre. Se elimina y se reintenta desde cero.
            document.querySelector<HTMLScriptElement>(`script[src="${EPAYCO_CHECKOUT_SCRIPT}"]`)?.remove();

            const script = document.createElement('script');
            script.src = EPAYCO_CHECKOUT_SCRIPT;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                // Permitimos reintentar en una próxima llamada.
                this.loadPromise = null;
                script.remove();
                reject(new Error('No se pudo cargar el checkout de ePayco.'));
            };
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }
}
