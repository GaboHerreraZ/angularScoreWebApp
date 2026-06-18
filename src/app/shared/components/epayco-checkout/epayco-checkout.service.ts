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
            const existing = document.querySelector<HTMLScriptElement>(
                `script[src="${EPAYCO_CHECKOUT_SCRIPT}"]`
            );

            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('No se pudo cargar el checkout de ePayco.')), { once: true });
                // Si ya estaba cargado, ePayco existe y resolvemos de inmediato.
                if (window.ePayco) resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = EPAYCO_CHECKOUT_SCRIPT;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                // Permitimos reintentar en una próxima llamada.
                this.loadPromise = null;
                reject(new Error('No se pudo cargar el checkout de ePayco.'));
            };
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }
}
