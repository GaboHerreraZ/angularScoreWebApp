import { Component } from '@angular/core';
import { AccordionModule } from 'primeng/accordion';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'faq-widget',
    imports: [AccordionModule, ScrollAnimateDirective],
    templateUrl: './faq-widget.html'
})
export class FaqWidget {}
