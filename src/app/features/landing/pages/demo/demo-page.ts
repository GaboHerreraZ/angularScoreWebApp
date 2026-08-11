import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';
import { ContactSalesWidget } from '@/app/features/landing/components/contact-sales-widget/contact-sales-widget';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    selector: 'app-demo-page',
    standalone: true,
    imports: [HeaderWidget, FooterWidget, ContactSalesWidget, ScrollAnimateDirective],
    templateUrl: './demo-page.html',
    styles: [
        `
            /* La tarjeta de resultado flota suavemente, como una notificación viva. */
            .float-card {
                animation: float-card 6s ease-in-out infinite;
            }

            @keyframes float-card {
                0%,
                100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-8px);
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .float-card {
                    animation: none;
                }
            }
        `
    ]
})
export class DemoPage {
    private meta = inject(Meta);

    readonly salesEmail = 'ventas@creditia.co';

    /** Expectativas de la demo: corta, remota y sin letra pequeña. */
    readonly logistics = [
        { icon: 'pi-clock', text: '30 minutos' },
        { icon: 'pi-video', text: 'Por videollamada' },
        { icon: 'pi-check-circle', text: 'Sin compromiso' }
    ];

    /** Lo que el prospecto verá en la demostración. */
    readonly demoHighlights = [
        { icon: 'pi-file-pdf', text: 'Un estudio de crédito completo, de PDF a score' },
        { icon: 'pi-shield', text: 'La consulta a Datacrédito Experian en vivo' },
        { icon: 'pi-pen-to-square', text: 'El pagaré digital con firma electrónica' }
    ];

    constructor() {
        this.meta.updateTag({
            name: 'description',
            content: 'Agenda una demo gratuita de CREDIT-IA y mira cómo evaluamos el riesgo de crédito de tus clientes con IA y Datacrédito Experian.'
        });
    }
}
