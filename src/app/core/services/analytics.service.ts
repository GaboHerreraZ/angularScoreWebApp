import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * Google Analytics 4 (gtag.js), cargado dinámicamente solo cuando el
 * environment define un measurement ID. En desarrollo queda vacío y todos
 * los métodos son no-op, así el tráfico local no contamina las métricas.
 *
 * Las vistas de página en cambios de ruta las registra la medición mejorada
 * de GA4 (eventos de historial del navegador); aquí solo van los eventos
 * de negocio del embudo.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private readonly measurementId = environment.gaMeasurementId;
    private loaded = false;

    /** Inyecta gtag.js una sola vez al arrancar la app (ver app.config.ts). */
    init(): void {
        if (!this.measurementId || this.loaded) return;
        this.loaded = true;

        window.dataLayer = window.dataLayer ?? [];
        window.gtag = function gtag(...args: unknown[]) {
            window.dataLayer!.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', this.measurementId);

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
        document.head.appendChild(script);
    }

    /** Evento genérico; los helpers de abajo definen el vocabulario del embudo. */
    trackEvent(name: string, params?: Record<string, unknown>): void {
        window.gtag?.('event', name, params);
    }

    /** Clic en "Lo quiero" de un pack (en /precios). */
    buyPackClick(packId: string, packName: string): void {
        this.trackEvent('click_buy_pack', { pack_id: packId, pack_name: packName });
    }

    /** Cuenta creada en el onboarding. */
    signUp(method: 'email' | 'google'): void {
        this.trackEvent('sign_up', { method });
    }

    /** Formulario comercial enviado (demo, precios, volumen…). */
    lead(subject: string): void {
        this.trackEvent('generate_lead', { form_subject: subject });
    }

    /** Compra de pack confirmada (evento estándar de GA4, con valor). */
    purchase(transactionId: string | null, packName: string, total: number): void {
        this.trackEvent('purchase', {
            transaction_id: transactionId ?? undefined,
            currency: 'COP',
            value: total,
            items: [{ item_name: packName }]
        });
    }

    /** Primera interacción con la calculadora de cartera vencida. */
    calculatorInteract(): void {
        this.trackEvent('calculator_interact');
    }
}
