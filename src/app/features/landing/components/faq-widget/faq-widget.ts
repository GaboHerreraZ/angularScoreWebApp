import { Component, input } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

/** Pregunta del acordeón. La respuesta admite HTML simple (strong, em…). */
export interface FaqItem {
    question: string;
    answer: string;
}


@Component({
    standalone: true,
    selector: 'faq-widget',
    imports: [AccordionModule, ScrollAnimateDirective],
    templateUrl: './faq-widget.html'
})
export class FaqWidget {
    /** Preguntas a mostrar en el acordeón. */
    items = input.required<FaqItem[]>();
    subtitle = input('Resuelve tus dudas sobre la plataforma');
}
