import { Component, inject } from '@angular/core';
import { AnalyticsService } from '@/app/core/services/analytics.service';

/** Número comercial de WhatsApp (formato wa.me: indicativo + número, sin signos). */
const WHATSAPP_NUMBER = '573145520847';
const PREFILLED_MESSAGE = 'Hola, vengo del sitio web de CREDIT-IA. Me interesa evaluar el crédito de mis clientes, ¿me pueden dar más información?';

/**
 * Botón flotante de WhatsApp para las páginas públicas del landing.
 * Se monta una sola vez dentro del footer-widget, así toda página pública
 * lo hereda sin tocar la app interna.
 */
@Component({
    standalone: true,
    selector: 'whatsapp-fab',
    templateUrl: './whatsapp-fab.html',
    styles: [
        `
            /*
              El tamano del icono va aca y no con text-*: primeicons.css define
              .pi { font-size } fuera de capas y le gana a @layer utilities
              (mismo caso que los sellos del footer).
            */
            a i {
                font-size: 2rem;
                line-height: 1;
            }
        `
    ]
})
export class WhatsappFab {
    private analytics = inject(AnalyticsService);

    readonly link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PREFILLED_MESSAGE)}`;

    onClick(): void {
        this.analytics.whatsappClick();
    }
}
