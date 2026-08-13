import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

/**
 * Teaser del estudio de ejemplo: una pregunta directa y una vista previa del
 * reporte con la recomendación de la IA borrosa, para empujar a /estudio-ejemplo.
 */
@Component({
    standalone: true,
    selector: 'study-teaser-widget',
    imports: [RouterModule, ButtonModule, Ripple, ScrollAnimateDirective],
    templateUrl: './study-teaser-widget.html'
})
export class StudyTeaserWidget {}
