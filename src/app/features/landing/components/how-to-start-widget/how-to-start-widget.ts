import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'how-to-start-widget',
    imports: [ButtonModule, ScrollAnimateDirective],
    templateUrl: './how-to-start-widget.html'
})
export class HowToStartWidget {
    /** Correo del área comercial para el CTA de contacto. */
    readonly salesEmail = 'comercial@creditia.co';
}
