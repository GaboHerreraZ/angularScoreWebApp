import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@/app/shared/directives/scroll-animate.directive';

@Component({
    standalone: true,
    selector: 'features-widget',
    imports: [ScrollAnimateDirective],
    templateUrl: './features-widget.html'
})
export class FeaturesWidget {}
