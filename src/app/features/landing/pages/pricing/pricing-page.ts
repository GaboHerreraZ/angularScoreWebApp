import { Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { HeaderWidget } from '@/app/features/landing/components/header-widget/header-widget';
import { FooterWidget } from '@/app/features/landing/components/footer-widget/footer-widget';
import { PricingPacksWidget } from '@/app/features/landing/components/pricing-packs-widget/pricing-packs-widget';
import { FaqItem, FaqWidget } from '@/app/features/landing/components/faq-widget/faq-widget';
import { LossCalculatorWidget } from '@/app/features/landing/components/loss-calculator-widget/loss-calculator-widget';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';


@Component({
    selector: 'app-pricing-page',
    standalone: true,
    imports: [RouterModule, ButtonModule, Ripple, HeaderWidget, FooterWidget, PricingPacksWidget, FaqWidget, LossCalculatorWidget, ScrollAnimateDirective],
    templateUrl: './pricing-page.html',
    styles: [
        `
            .vs-line {
                height: 0;
                transition: height 1200ms ease-out 250ms;
            }

            .scroll-animated .vs-line {
                height: 100%;
            }

            /* "Venta cerrada": barrido de luz sobre el texto, en loop suave. */
            .win-text {
                background: linear-gradient(90deg, var(--p-primary-400), #34d399, var(--p-primary-400));
                background-size: 200% 100%;
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                animation: win-sweep 2.6s linear infinite;
            }

            @keyframes win-sweep {
                to {
                    background-position: -200% 0;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                .vs-line {
                    height: 100%;
                    transition: none;
                }

                .win-text {
                    animation: none;
                }
            }
        `
    ]
})
export class PricingPage {
    private meta = inject(Meta);

    readonly withoutCreditia = [
        'El cliente pide un cupo de crédito',
        '«Déjame consultarlo y te aviso…»',
        'Días esperando papeles y referencias',
        'La venta se enfría — o se va a la competencia'
    ];

    /** El cierre ("Venta cerrada…") va aparte en el template, con su brillo. */
    readonly withCreditia = [
        'Pides el documento y consultas al instante',
        'El score llega en 15 minutos',
        'Generas el pagaré y se firma en línea'
    ];

    /** Preguntas frecuentes sobre paquetes y pagos. */
    readonly faq: FaqItem[] = [
        {
            question: '¿Puedo usar Credit-ia gratis?',
            answer: 'Credit-ia no cuenta con una versión gratuita. Es una solución empresarial que funciona por paquetes de Análisis de Crédito: compras la cantidad que necesitas y la usas cuando quieras, sin suscripciones ni permanencia. Si deseas conocerla antes de decidir, nuestro equipo comercial agenda una demostración personalizada donde verás la plataforma en acción, operando con un caso real de la industria, para que evalúes su valor con total claridad.'
        },
        {
            question: '¿Qué incluye cada análisis?',
            answer: 'Todos los packs incluyen lo mismo: consulta en <strong>Datacrédito Experian</strong>, lectura de los estados financieros en PDF, score de riesgo con IA, reporte del estudio y pagaré digital con firma electrónica. Solo cambia el precio por volumen.'
        },
        {
            question: '¿Los paquetes vencen?',
            answer: 'Cada paquete tiene una vigencia que ves claramente antes de comprar. Dentro de ella, usas tus análisis cuando quieras: no hay ciclos de facturación ni cobros automáticos.'
        },
        {
            question: '¿Qué pasa cuando se me acaban los análisis?',
            answer: 'Simplemente compras otro paquete cuando lo necesites, del tamaño que quieras. No hay ciclos de facturación ni cobros automáticos: solo pagas por los Análisis de Crédito que vas a usar.'
        }
    ];

    constructor() {
        this.meta.updateTag({
            name: 'description',
            content: 'Paquetes de análisis de crédito sin suscripciones ni mensualidades. Cada análisis incluye consulta en Datacrédito Experian, score con IA y pagaré digital.'
        });
    }
}
