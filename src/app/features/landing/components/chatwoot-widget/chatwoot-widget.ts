import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AnalyticsService } from '@/app/core/services/analytics.service';
import { environment } from '@/environments/environment';

declare global {
    interface Window {
        chatwootSettings?: Record<string, unknown>;
        chatwootSDK?: { run: (config: { websiteToken: string; baseUrl: string }) => void };
        $chatwoot?: { toggleBubbleVisibility: (state: 'show' | 'hide') => void };
    }
}

const SCRIPT_ID = 'chatwoot-sdk';

/** Hay una instancia del widget viva en la página (ver ngOnInit/ngOnDestroy). */
let mounted = false;

/**
 * Widget de chat de Chatwoot (inbox propio) para las páginas públicas del landing.
 * Reemplaza al botón flotante de WhatsApp: se monta una sola vez dentro del
 * footer-widget, así toda página pública lo hereda sin tocar la app interna.
 *
 * El SDK inyecta su propia burbuja directamente en el body, fuera de Angular;
 * por eso el componente no renderiza nada y solo se encarga de cargar el script
 * una vez y de ocultar la burbuja al salir hacia la app interna.
 */
@Component({
    standalone: true,
    selector: 'chatwoot-widget',
    template: ''
})
export class ChatwootWidget implements OnInit, OnDestroy {
    private analytics = inject(AnalyticsService);

    private readonly baseUrl = environment.chatwootBaseUrl;
    private readonly websiteToken = environment.chatwootWebsiteToken;

    ngOnInit(): void {
        if (!this.baseUrl || !this.websiteToken) return;
        mounted = true;

        window.addEventListener('chatwoot:on-start-conversation', this.onStartConversation);

        // Al volver a una página pública el SDK ya está en memoria: basta con
        // devolver la burbuja que ocultamos al salir.
        if (window.$chatwoot) {
            window.$chatwoot.toggleBubbleVisibility('show');
            return;
        }

        // Script en vuelo desde un montaje anterior: se muestra solo al quedar listo.
        if (document.getElementById(SCRIPT_ID)) return;

        this.loadSdk();
    }

    ngOnDestroy(): void {
        mounted = false;
        window.removeEventListener('chatwoot:on-start-conversation', this.onStartConversation);
        window.$chatwoot?.toggleBubbleVisibility('hide');
    }

    private loadSdk(): void {
        window.chatwootSettings = {
            position: 'right',
            type: 'expanded_bubble',
            launcherTitle: '',
            locale: 'es'
        };

        // Si la carga termina después de salir del landing, la burbuja no debe
        // aparecer encima de la app interna.
        window.addEventListener('chatwoot:ready', () => {
            if (!mounted) window.$chatwoot?.toggleBubbleVisibility('hide');
        }, { once: true });

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = `${this.baseUrl}/packs/js/sdk.js`;
        script.async = true;
        script.onload = () => window.chatwootSDK?.run({ websiteToken: this.websiteToken, baseUrl: this.baseUrl });
        document.head.appendChild(script);
    }

    private onStartConversation = (): void => this.analytics.chatConversationStarted();
}
