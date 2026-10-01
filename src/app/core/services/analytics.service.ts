import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * Google Analytics 4 y Google Ads (gtag.js), cargado dinámicamente solo cuando
 * el environment define al menos un ID. En desarrollo quedan vacíos y todos
 * los métodos son no-op, así el tráfico local no contamina las métricas.
 *
 * Ads comparte la misma librería: si el environment trae el ID AW-... se
 * configura (con o sin GA4) y el registro reporta la conversión "Sign-up".
 *
 * Las vistas de página en cambios de ruta las registra la medición mejorada
 * de GA4 (eventos de historial del navegador); aquí solo van los eventos
 * de negocio del embudo.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private readonly measurementId = environment.gaMeasurementId;
    private readonly adsId = environment.googleAdsId;
    private readonly adsSignUpLabel = environment.googleAdsSignUpLabel;
    private loaded = false;

    /**
     * Inyecta gtag.js una sola vez al arrancar la app (ver app.config.ts).
     * Basta con que exista alguno de los dos IDs (GA4 o Ads): la librería es
     * la misma y cada ID presente se configura por separado.
     */
    init(): void {
        const ids = [this.measurementId, this.adsId].filter((id): id is string => !!id);
        if (ids.length === 0 || this.loaded) return;
        this.loaded = true;

        window.dataLayer = window.dataLayer ?? [];
        // gtag.js solo procesa entradas que sean objetos `arguments` (como en
        // el snippet oficial). Un Array con rest params lo ignora en silencio
        // y no envía ningún ping, ni de GA4 ni de Ads.
        // eslint-disable-next-line prefer-rest-params
        window.gtag = function gtag() {
            window.dataLayer!.push(arguments);
        };
        window.gtag('js', new Date());
        for (const id of ids) {
            window.gtag('config', id);
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ids[0]}`;
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
        this.adsConversion(this.adsSignUpLabel);
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

    /**
     * Conversión de Google Ads. El registro con Google redirige de inmediato,
     * por eso se pide transporte beacon: el navegador termina el envío aunque
     * la página se descargue.
     */
    private adsConversion(label: string): void {
        if (!this.adsId || !label) return;
        this.trackEvent('conversion', {
            send_to: `${this.adsId}/${label}`,
            transport_type: 'beacon'
        });
    }

    /** Primera interacción con la calculadora de cartera vencida. */
    calculatorInteract(): void {
        this.trackEvent('calculator_interact');
    }

    /** El visitante abrió una conversación en el chat del sitio (Chatwoot). */
    chatConversationStarted(): void {
        this.trackEvent('chat_start');
    }
}
